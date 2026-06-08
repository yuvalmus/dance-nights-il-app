import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import DancerAvatar from './DancerAvatar';

type Props = {
  /** Total number of friends going — only a count is needed, not identities. */
  friendCount: number;
};

const MAX_AVATARS = 3;
const AVATAR_SIZE = 38;

/**
 * Overlapping circular avatars signalling friend presence. At most three are
 * drawn; any remainder collapses into a "+N" circle.
 */
export default function SocialAvatarRow({ friendCount }: Props) {
  if (friendCount === 0) return null;

  const avatarsShown = Math.min(friendCount, MAX_AVATARS);
  const overflowCount = friendCount - avatarsShown;

  return (
    <View style={styles.row}>
      {Array.from({ length: avatarsShown }).map((_, index) => (
        <DancerAvatar key={index} size={AVATAR_SIZE} style={styles.overlap} />
      ))}
      {overflowCount > 0 && (
        <View style={[styles.overflowAvatar, styles.overlap]}>
          <Text style={styles.overflowText}>+{overflowCount}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
  },
  overlap: {
    marginStart: -10,
  },
  overflowAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: Colors.border,
    borderWidth: 2,
    borderColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
});
