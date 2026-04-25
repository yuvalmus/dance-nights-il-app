/**
 * Profile-screen section listing courses the user is personally tied to —
 * venue-hosted (owner view) or authored/instructed (artist view). Shared
 * across both roles so the profile has a single "my courses" surface.
 */

import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { useMyCourses } from '@/hooks/useMyCourses';
import ActionButton from '@/components/ui/ActionButton';
import MyCourseRow from './MyCourseRow';

type Props = {
  /**
   * Present when the user owns a venue. Enables owner-side features:
   * pulling in venue-hosted courses that aren't theirs, and routing
   * pending/rejected rows into the approval flow.
   */
  venueId?: string;
  /**
   * When true, renders the "הוסף קורס" CTA and keeps the section visible
   * even if the user has no courses yet. Used for venue owners and
   * verified artists — anyone entitled to create a course.
   */
  canCreate?: boolean;
};

const PAST_LIMIT = 5;

export default function MyCoursesSection({ venueId, canCreate = false }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const { upcoming, past, pending, loading } = useMyCourses({
    userId: user?.id,
    venueId,
  });

  if (loading) return null;

  const isEmpty =
    upcoming.length === 0 && past.length === 0 && pending.length === 0;

  // Show the card to anyone who can create courses (venue owners, artists)
  // even when empty — they need the "add course" affordance. Plain dancers
  // only see it when they actually have courses tied to them.
  if (isEmpty && !canCreate) return null;

  // Mirrors the section-visibility policy we use above: anyone already
  // surfaced here (venue owner, verified artist, OR a user with existing
  // courses tied to them as creator/instructor) also gets the add button.
  // Keeps artists who aren't formally flagged `is_artist=true` — but who
  // clearly operate as instructors — from losing access to "add course".
  const showAddButton = canCreate || !isEmpty;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="school-outline" size={22} color={Colors.primary} />
        <Text style={styles.title}>הקורסים שלי</Text>
      </View>

      {showAddButton && (
        <ActionButton
          label="+ הוסף קורס חדש"
          onPress={() => router.push('/course/add')}
        />
      )}

      {isEmpty && (
        <Text style={styles.empty}>
          {venueId
            ? 'אין עדיין קורסים במקום שלך.'
            : 'אין לך קורסים עדיין.'}
        </Text>
      )}

      {pending.length > 0 && (
        <View style={styles.group}>
          <Text style={styles.groupTitle}>
            ממתינים לאישור ({pending.length})
          </Text>
          {pending.map((c) => (
            <MyCourseRow key={c.id} course={c} ownedVenueId={venueId} />
          ))}
        </View>
      )}

      {upcoming.length > 0 && (
        <View style={styles.group}>
          <Text style={styles.groupTitle}>קורסים קרובים</Text>
          {upcoming.map((c) => (
            <MyCourseRow key={c.id} course={c} ownedVenueId={venueId} />
          ))}
        </View>
      )}

      {past.length > 0 && (
        <View style={styles.group}>
          <Text style={styles.groupTitle}>קורסים שעברו</Text>
          {past.slice(0, PAST_LIMIT).map((c) => (
            <MyCourseRow key={c.id} course={c} ownedVenueId={venueId} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  empty: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
  group: {
    marginTop: 8,
  },
  groupTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 4,
  },
});
