import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { useInstructorSearch } from '@/hooks/useInstructorSearch';
import SearchBar from '../ui/SearchBar';

type InstructorInviteProps = {
  excludeIds: Set<string>;
  onInvite: (userId: string) => Promise<void>;
};

/**
 * Search-and-invite box for the venue owner.
 * Includes both regular users and artists; artist status is shown as a badge.
 */
export default function InstructorInvite({ excludeIds, onInvite }: InstructorInviteProps) {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const { results } = useInstructorSearch(query);

  const filtered = results.filter((a) => !excludeIds.has(a.id)).slice(0, 5);

  const handleInvite = async (userId: string, name: string | null) => {
    setBusy(userId);
    try {
      await onInvite(userId);
      setQuery('');
      Alert.alert('הזמנה נשלחה', `${name ?? 'המשתמש'} יקבל/תקבל בקשה לאשר`);
    } catch (err: any) {
      Alert.alert('שגיאה', err?.message ?? 'לא הצלחנו לשלוח הזמנה');
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.container}>
      <SearchBar value={query} onChangeText={setQuery} placeholder="חיפוש משתמש להזמנה..." />

      {query.trim().length > 0 && (
        <View style={styles.results}>
          {filtered.length === 0 && (
            <Text style={styles.empty}>אין התאמות</Text>
          )}
          {filtered.map((candidate) => (
            <TouchableOpacity
              key={candidate.id}
              style={styles.row}
              disabled={busy === candidate.id}
              onPress={() => handleInvite(candidate.id, candidate.display_name)}
            >
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowText}>{candidate.display_name ?? 'ללא שם'}</Text>
                <View style={styles.artistRow}>
                  {candidate.is_artist && <Text style={styles.artistBadge}>אמן מאומת</Text>}
                  <MaterialCommunityIcons name='check-decagram-outline' size={14} color={Colors.primary} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 14,
  },
  results: {
    marginTop: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowText: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    textAlign: 'right',
  },
  rowTextWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  artistRow: {
    flexDirection: 'row-reverse',
    gap: 4,
    alignItems: 'center',
  },
  artistBadge: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  empty: {
    color: Colors.textMuted,
    padding: 12,
    textAlign: 'center',
    fontSize: 13,
  },
});
