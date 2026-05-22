import { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { ActivityFriend, SocialState } from '@/hooks/useActivitySocial';
import SocialAvatarRow from './SocialAvatarRow';
import SocialJoinButton from './SocialJoinButton';

type ActivityType = 'event' | 'course';

type Props = {
  activityType: ActivityType;
  /** Event or course id — used to open the friends-going list. */
  activityId: string;
  /** Activity title — passed to the friends-going screen for its share. */
  activityTitle: string;
  state: SocialState;
  friends: ActivityFriend[];
  viewerGoing: boolean;
  toggling: boolean;
  loading: boolean;
  onJoin: () => void;
};

/** The copy + visual variant the block renders for a given social state. */
type SocialContent = {
  headline: string;
  caption: string;
  joinLabel: string;
  /** Label once joined — the settled state shown on a later visit. */
  joinedLabel: string;
  /**
   * Label shown right after a join tap, before the screen is left. Optional —
   * states without a distinct fresh confirmation reuse `joinedLabel`.
   */
  joinedLabelOnTap?: string;
  /** Friends state shows real avatars; other states show the people badge. */
  showsAvatars: boolean;
};

/** The join CTA always carries a plus — the universal "add me" affordance. */
const JOIN_ICON = 'add';

const NAMES_SHOWN = 3;

function friendsHeadline(friendCount: number): string {
  return friendCount === 1 ? 'חבר אחד מגיע' : `${friendCount} חברים מגיעים`;
}

function friendsCaption(friends: ActivityFriend[]): string {
  const names = friends.slice(0, NAMES_SHOWN).map((f) => f.display_name || 'חבר');
  const overflowCount = friends.length - names.length;
  return overflowCount > 0
    ? `${names.join(', ')} ועוד ${overflowCount}`
    : names.join(', ');
}

/**
 * Resolves the state-specific copy so the component body stays a thin render.
 * Each state is intentional, never a fallback:
 *   - friends  → belonging,   - momentum → activity,   - early → invitation.
 * No state ever references crowd size, so an empty activity is never hinted.
 */
function buildSocialContent(
  state: SocialState,
  activityType: ActivityType,
  friends: ActivityFriend[],
): SocialContent {
  const joinedNoun = activityType === 'event' ? 'באירוע' : 'בקורס';
  const towardNoun = activityType === 'event' ? 'לאירוע' : 'לקורס';

  if (state === 'friends') {
    return {
      headline: friendsHeadline(friends.length),
      caption: friendsCaption(friends),
      joinLabel: `הצטרף לחברים שלך ${joinedNoun}`,
      // A fresh tap confirms the social act; a later visit settles to neutral.
      joinedLabelOnTap: `הצטרפת לחברים שלך ${joinedNoun}`,
      joinedLabel: 'אתה בפנים',
      showsAvatars: true,
    };
  }

  if (state === 'momentum') {
    return {
      headline: 'אנשים כבר מתכננים להגיע',
      caption: 'מתחיל להיות מעניין כאן',
      joinLabel: `הצטרף ${towardNoun}`,
      joinedLabel: `נרשמת ${towardNoun}`,
      showsAvatars: false,
    };
  }

  return {
    headline: 'בא לך לרקוד כאן?',
    caption: 'סמן הגעה ואל תפספס',
    joinLabel: 'אני מגיע',
    joinedLabel: 'אתה בפנים',
    showsAvatars: false,
  };
}

/**
 * The "why should I care" block: a state-aware social proof card placed
 * directly under the hero, above the activity details. It always presents an
 * intentional reason to act and never renders a "0" — an empty activity is
 * reframed (early-adopter), not exposed.
 */
export default function SocialSection({
  activityType,
  activityId,
  activityTitle,
  state,
  friends,
  viewerGoing,
  toggling,
  loading,
  onJoin,
}: Props) {
  const router = useRouter();
  // True once the viewer taps to join during this mount — drives the fresh
  // "you joined your friends" confirmation. It resets when the screen is left
  // and re-entered, so a later visit shows the settled label instead.
  const [joinedViaTap, setJoinedViaTap] = useState(false);

  if (loading) {
    return (
      <View style={[styles.card, styles.loadingCard]}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  const content = buildSocialContent(state, activityType, friends);
  const joinedLabel =
    joinedViaTap && content.joinedLabelOnTap
      ? content.joinedLabelOnTap
      : content.joinedLabel;
  const showFriendsUpdated = joinedViaTap && viewerGoing && state === 'friends';

  // A tap that starts a join (not one that leaves) arms the fresh confirmation.
  const handleJoin = () => {
    setJoinedViaTap(!viewerGoing);
    onJoin();
  };

  const openFriendsList = () => {
    router.push({
      pathname: '/activity/friends',
      params: { activityId, activityType, title: activityTitle },
    });
  };

  const headerText = (
    <View style={styles.textBlock}>
      <Text style={styles.headline} numberOfLines={1}>{content.headline}</Text>
      <Text style={styles.caption} numberOfLines={1}>{content.caption}</Text>
    </View>
  );

  return (
    <View style={styles.card}>
      {content.showsAvatars ? (
        // Friends state — the row drills into the full attendee list.
        <Pressable
          style={styles.header}
          onPress={openFriendsList}
          accessibilityRole="button"
        >
          <SocialAvatarRow friendCount={friends.length} />
          {headerText}
          <Ionicons name="chevron-back" size={20} color={Colors.textMuted} />
        </Pressable>
      ) : (
        <View style={styles.header}>
          <View style={styles.iconBadge}>
            <Ionicons name="people" size={22} color={Colors.primary} />
          </View>
          {headerText}
        </View>
      )}

      <SocialJoinButton
        joined={viewerGoing}
        busy={toggling}
        labelDefault={content.joinLabel}
        labelJoined={joinedLabel}
        leadingIcon={JOIN_ICON}
        onPress={handleJoin}
      />

      {/* Reinforce that the action is social — only meaningful with friends. */}
      {showFriendsUpdated && (
        <Text style={styles.feedback}>החברים שלך יקבלו עדכון</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 14,
  },
  loadingCard: {
    minHeight: 128,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(212, 160, 23, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    gap: 3,
  },
  headline: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
  },
  caption: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'right',
  },
  feedback: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: -4,
  },
});
