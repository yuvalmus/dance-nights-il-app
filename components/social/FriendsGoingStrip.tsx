import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

type FriendItem = {
  id: string;
  display_name: string | null;
};

type Props = {
  friends: FriendItem[];
};

function getInitials(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function Avatar({ name }: { name: string | null }) {
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{getInitials(name)}</Text>
    </View>
  );
}

export default function FriendsGoingStrip({ friends }: Props) {
  if (friends.length === 0) return null;

  const visible = friends.slice(0, 5);
  const overflow = friends.length - visible.length;

  return (
    <View style={styles.container}>
      <View style={styles.avatarRow}>
        {visible.map((f) => (
          <Avatar key={f.id} name={f.display_name} />
        ))}
        {overflow > 0 && (
          <View style={[styles.avatar, styles.overflowBadge]}>
            <Text style={styles.overflowText}>+{overflow}</Text>
          </View>
        )}
      </View>
      <Text style={styles.names} numberOfLines={1}>
        {visible.map((f) => f.display_name ?? 'חבר/ה').join(', ')}
        {overflow > 0 ? ` ועוד ${overflow}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  avatarRow: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginStart: -6,
  },
  avatarText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  overflowBadge: {
    backgroundColor: Colors.border,
  },
  overflowText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  names: {
    flex: 1,
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
  },
});
