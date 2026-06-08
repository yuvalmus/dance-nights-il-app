// supabase/functions/dispatch-notification/index.ts
//
// Triggered by a Database Webhook on `notifications` INSERT/UPDATE where
// `push_eligible = true`. Responsible for fanning the row out to Expo's push
// API, while respecting the user's per-category preferences and a 30-minute
// debounce on aggregated group_keys.
//
// The DB writes the inbox row eagerly (the user always has accurate inbox
// state); this function deals only with device-level delivery. Failures are
// logged but never bubble back to the DB — push is best-effort.
//
// Expected webhook payload (Supabase format):
//   {
//     type: 'INSERT' | 'UPDATE',
//     table: 'notifications',
//     record: { id, user_id, type, title, body, data, group_key, push_eligible,
//                last_push_at, ... },
//     old_record?: { ... } // present on UPDATE
//   }

import { createClient } from 'npm:@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const DEBOUNCE_MS = 30 * 60 * 1000; // 30 minutes — matches the plan spec.

// Types that fire immediately even if the group_key was recently pushed.
// These are actionable — the user expects them in real time.
const IMMEDIATE_TYPES = new Set([
  'friend_request',
  'course_pending_approval',
  'instructor_invite',
]);

// Map each notification type to the preferences bucket the user can mute.
// Anything missing falls through to "always send" — the DB layer is the
// source of truth for what fires, this map is just the user-controlled gate.
const TYPE_TO_PREFERENCE: Record<string, string> = {
  friends_going:             'social',
  friend_going_event:        'social',
  friend_going_course:       'social',
  friend_request:            'friend_requests',
  friend_accepted:           'friend_requests',
  course_pending_approval:   'management',
  course_approved:           'management',
  course_rejected:           'management',
  instructor_invite:         'management',
  instructor_left_venue:     'management',
  registration_spike:        'management',
  event_date_changed:        'event_updates',
  event_cancelled:           'event_updates',
  event_reminder:            'reminders',
  course_starting_this_week: 'reminders',
  spots_low:                 'reminders',
  favorite_venue_event:      'favorites',
  favorite_artist_course:    'favorites',
};

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  group_key: string | null;
  push_eligible: boolean;
  last_push_at: string | null;
};

type WebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: NotificationRow;
  old_record?: NotificationRow;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

async function sendToExpo(token: string, row: NotificationRow): Promise<boolean> {
  const message = {
    to: token,
    sound: 'default',
    title: row.title,
    body: row.body ?? '',
    data: {
      ...(row.data ?? {}),
      notification_id: row.id,
      type: row.type,
    },
  };

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        'accept-encoding': 'gzip, deflate',
      },
      body: JSON.stringify(message),
    });
    if (!res.ok) {
      console.warn('Expo push HTTP error', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Expo push failed', err);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method not allowed' }, 405);
  }

  let payload: WebhookPayload;
  try {
    payload = (await req.json()) as WebhookPayload;
  } catch {
    return jsonResponse({ error: 'invalid json' }, 400);
  }

  const row = payload.record;
  if (!row || payload.table !== 'notifications') {
    return jsonResponse({ skipped: 'not a notifications row' });
  }
  if (!row.push_eligible) {
    return jsonResponse({ skipped: 'push_eligible = false' });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // 1. Debounce — same group_key within DEBOUNCE_MS gets at most one push,
  //    unless the type is on the immediate-fire allowlist.
  if (
    row.group_key &&
    row.last_push_at &&
    !IMMEDIATE_TYPES.has(row.type)
  ) {
    const sinceMs = Date.now() - new Date(row.last_push_at).getTime();
    if (sinceMs < DEBOUNCE_MS) {
      return jsonResponse({ skipped: 'debounced', sinceMs });
    }
  }

  // 2. Look up the recipient's preferences + push token.
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('expo_push_token, notification_preferences')
    .eq('id', row.user_id)
    .single();

  if (profileErr) {
    console.warn('profile fetch failed', profileErr);
    return jsonResponse({ error: 'profile lookup failed' }, 500);
  }
  if (!profile?.expo_push_token) {
    return jsonResponse({ skipped: 'no push token' });
  }

  const bucket = TYPE_TO_PREFERENCE[row.type];
  if (bucket) {
    const prefs = (profile.notification_preferences ?? {}) as Record<string, boolean>;
    if (prefs[bucket] === false) {
      return jsonResponse({ skipped: 'preference muted', bucket });
    }
  }

  // 3. Dispatch + stamp last_push_at so the debouncer behaves on the next
  //    update of this group_key.
  const ok = await sendToExpo(profile.expo_push_token, row);
  if (!ok) {
    return jsonResponse({ error: 'expo push failed' }, 502);
  }

  // Reset push_eligible alongside stamping last_push_at. The webhook will
  // re-fire on this UPDATE — the `push_eligible = false` guard at the top
  // short-circuits it. upsert_notification() re-arms the flag on the next
  // group_key collision (its OR-merge logic).
  await supabase
    .from('notifications')
    .update({
      last_push_at: new Date().toISOString(),
      push_eligible: false,
    })
    .eq('id', row.id);

  return jsonResponse({ delivered: true });
});
