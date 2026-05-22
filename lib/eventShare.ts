import { Share } from 'react-native';

/**
 * Shares an invitation to a dance event. Events have no standalone detail
 * route (they live as cards in the tonight feed), so the invite carries the
 * event name only — there is no deep link to hand off.
 */
export async function shareEventLink({ title }: { title: string }): Promise<void> {
  await Share.share({ message: `בוא נרקוד יחד באירוע "${title}"` });
}
