import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { FriendCandidate } from '@/hooks/useFriendSearch';

type Props = {
  candidate: FriendCandidate;
  sending: boolean;
  onSendRequest: () => void;
};

export default function FriendSearchResultRow({ candidate, sending, onSendRequest }: Props) {
  const hasVenue = !!candidate.venue_name;

  return (
    <View style={styles.row}>
      {/* Avatar — dancing icon matching the profile screen */}
      <View style={styles.avatar}>
        <MaterialCommunityIcons name="human-female-dance" size={26} color={Colors.primary} />
      </View>

      {/* Info column */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {candidate.display_name ?? 'משתמש/ת'}
          </Text>
          {candidate.is_artist && (
            <View style={styles.artistBadge}>
              <Ionicons name="checkmark-circle" size={13} color={Colors.primary} />
              <Text style={styles.artistText}>אמן/ית</Text>
            </View>
          )}
        </View>

        {hasVenue && (
          <View style={styles.venueRow}>
            {candidate.venue_logo_url ? (
              <Image
                source={{ uri: candidate.venue_logo_url }}
                style={styles.venueLogo}
              />
            ) : (
              <Ionicons name="business-outline" size={13} color={Colors.textMuted} />
            )}
            <Text style={styles.venueName} numberOfLines={1}>
              {candidate.venue_name}
            </Text>
          </View>
        )}
      </View>

      {/* Action button — icon only */}
      <TouchableOpacity
        style={[styles.addButton, candidate.pending && styles.addButtonPending]}
        onPress={onSendRequest}
        disabled={candidate.pending || sending}
        activeOpacity={0.7}
      >
        {sending ? (
          <ActivityIndicator size="small" color={Colors.text} />
        ) : candidate.pending ? (
          <Ionicons name="hourglass-outline" size={18} color={Colors.textMuted} />
        ) : (
          <Ionicons name="person-add" size={18} color={Colors.background} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  artistBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(212, 160, 23, 0.12)',
  },
  artistText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  venueRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  venueLogo: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  venueName: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonPending: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
