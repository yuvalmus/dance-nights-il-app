import { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { useActivitySocial } from '@/hooks/useActivitySocial';
import { shareCourseLink } from '@/lib/courseShare';
import { shareEventLink } from '@/lib/eventShare';
import FriendGoingRow from '@/components/social/FriendGoingRow';

/**
 * Full-screen list of friends who marked "going" for an event or course —
 * opened from the social block's avatar row. Read-only: no unfriend, no add
 * friends. The header carries a share button to invite more people.
 */
export default function ActivityFriendsScreen() {
  const navigation = useNavigation();
  const params = useLocalSearchParams<{
    activityId?: string;
    activityType?: string;
    title?: string;
  }>();

  const isEvent = params.activityType === 'event';
  const activityId = params.activityId ?? '';
  const title = params.title ?? '';

  const { friends, loading } = useActivitySocial(
    isEvent ? { eventId: activityId } : { courseId: activityId },
  );

  const handleShare = useCallback(() => {
    if (isEvent) {
      shareEventLink({ title });
    } else {
      shareCourseLink({ courseId: activityId, title });
    }
  }, [isEvent, activityId, title]);

  useEffect(() => {
    navigation.setOptions({
      title: isEvent ? 'חברים שמגיעים לאירוע' : 'חברים שמגיעים לקורס',
      headerLeft: () => (
        <TouchableOpacity onPress={handleShare} hitSlop={8} style={styles.shareBtn}>
          <Ionicons name="share-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, isEvent, handleShare]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="people-outline" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>חברים ({friends.length})</Text>
        </View>

        {friends.length === 0 ? (
          <Text style={styles.emptyText}>אף חבר עדיין לא סימן הגעה.</Text>
        ) : (
          friends.map((friend) => <FriendGoingRow key={friend.id} friend={friend} />)
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  section: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
