/**
 * Notifications mutation helpers. Clients cannot INSERT — rows are created
 * by DB triggers — so the surface here is just "mark as read" helpers.
 */

import { supabase } from '@/lib/supabase';
import { invalidateByPrefix } from '@/lib/cache';

function clearNotificationCaches() {
  invalidateByPrefix('notifications:');
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .is('read_at', null);

  if (error) throw error;
  clearNotificationCaches();
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) throw error;
  clearNotificationCaches();
}
