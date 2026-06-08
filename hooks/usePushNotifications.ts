/**
 * usePushNotifications — handle device push registration end-to-end.
 *
 * The hook is mounted once at the root (see app/_layout.tsx). It:
 *
 *   1. Sets the foreground notification handler so a push received while
 *      the app is open still renders a banner.
 *   2. Requests permission lazily once the user is signed in. Anonymous
 *      browsing must not prompt — we don't have a row to write into yet.
 *   3. Persists the Expo push token onto `profiles.expo_push_token`.
 *   4. Subscribes to tap responses and routes to the deep link the DB
 *      trigger embedded in `data.deep_link`.
 *
 * Failures are logged but never thrown — push is a nice-to-have, not a
 * blocker for using the app.
 */

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

// Foreground behaviour: show the banner + bump the badge so the user can
// still notice an event while in the app.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

async function ensurePermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function configureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#d4a017',
  });
}

async function fetchExpoPushToken(): Promise<string | null> {
  const projectId =
    (Constants.expoConfig?.extra as any)?.eas?.projectId ??
    (Constants as any).easConfig?.projectId;
  if (!projectId) return null;
  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (err) {
    // Simulators / web / missing entitlements end up here. We never want
    // push registration to crash the app — log and move on.
    console.warn('Push: failed to fetch Expo token', err);
    return null;
  }
}

async function persistTokenIfChanged(userId: string, token: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('expo_push_token')
    .eq('id', userId)
    .single();
  if (error) {
    console.warn('Push: profile read failed', error);
    return;
  }
  if (data?.expo_push_token === token) return;
  const { error: writeErr } = await supabase
    .from('profiles')
    .update({ expo_push_token: token })
    .eq('id', userId);
  if (writeErr) console.warn('Push: profile write failed', writeErr);
}

// Route to the screen the trigger embedded in `data.deep_link`. Falls back
// to the inbox so a missing/malformed link never strands the user.
function handleTapResponse(
  response: Notifications.NotificationResponse,
  push: (route: string) => void,
) {
  const data = response.notification.request.content.data as { deep_link?: string };
  push(data?.deep_link ?? '/notifications');
}

export function usePushNotifications() {
  const { user } = useAuth();
  const router = useRouter();
  const responseSub = useRef<Notifications.Subscription | null>(null);
  // Cold-start tap responses are also re-emitted via the listener after
  // mount, so we guard against handling the same response twice.
  const handledRef = useRef<string | null>(null);

  // 1. Register the device for push as soon as the user is signed in.
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    (async () => {
      const granted = await ensurePermission();
      if (!granted || cancelled) return;
      await configureAndroidChannel();
      const token = await fetchExpoPushToken();
      if (!token || cancelled) return;
      await persistTokenIfChanged(user.id, token);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // 2. Tap-handling — two code paths cover all delivery cases:
  //    * cold-start: tap on a terminated/swiped-away app surfaces via
  //      getLastNotificationResponseAsync once on mount.
  //    * foreground / background: live taps fire the listener below.
  useEffect(() => {
    const push = (route: string) => router.push(route as any);

    (async () => {
      const last = await Notifications.getLastNotificationResponseAsync();
      if (!last) return;
      const id = last.notification.request.identifier;
      if (handledRef.current === id) return;
      handledRef.current = id;
      handleTapResponse(last, push);
    })();

    responseSub.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const id = response.notification.request.identifier;
        if (handledRef.current === id) return;
        handledRef.current = id;
        handleTapResponse(response, push);
      },
    );
    return () => {
      responseSub.current?.remove();
      responseSub.current = null;
    };
  }, [router]);
}
