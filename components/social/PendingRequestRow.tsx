import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';

type Props = {
  request: {
    id: string;
    display_name: string | null;
    is_artist: boolean;
  };
  onAccept: () => void;
  onDecline: () => void;
};

function getInitials(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function PendingRequestRow({ request, onAccept, onDecline }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(request.display_name)}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{request.display_name ?? 'משתמש/ת'}</Text>
        {request.is_artist && (
          <View style={styles.artistTag}>
            <Ionicons name="checkmark-circle" size={12} color={Colors.primary} />
            <Text style={styles.artistText}>אמן/ית</Text>
          </View>
        )}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.acceptBtn} onPress={onAccept}>
          <Ionicons name="checkmark" size={18} color={Colors.background} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.declineBtn} onPress={onDecline}>
          <Ionicons name="close" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
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
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
