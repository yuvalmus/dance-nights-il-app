import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { FriendProfile } from '@/types/database';

type Props = {
  friend: FriendProfile;
  onRemove: () => void;
};

function getInitials(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function FriendRow({ friend, onRemove }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(friend.display_name)}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{friend.display_name ?? 'משתמש/ת'}</Text>
        {friend.is_artist && (
          <View style={styles.artistTag}>
            <Ionicons name="checkmark-circle" size={12} color={Colors.primary} />
            <Text style={styles.artistText}>אמן/ית</Text>
          </View>
        )}
      </View>
      <TouchableOpacity onPress={onRemove} hitSlop={8}>
        <Ionicons name="close-outline" size={22} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    alignItems: 'flex-end',
  },
  name: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  artistTag: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  artistText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
});
