import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { useFriendSearch, FriendCandidate } from '@/hooks/useFriendSearch';
import { supabase } from '@/lib/supabase';
import { invalidate, invalidateByPrefix } from '@/lib/cache';

export default function FriendsSection() {
  const [query, setQuery] = useState('');
  const { results, loading } = useFriendSearch(query);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  const handleSendRequest = useCallback(async (candidate: FriendCandidate) => {
    if (candidate.pending) return;
    setSendingTo(candidate.id);
    try {
      const { error } = await supabase.rpc('request_friend', {
        target_id: candidate.id,
      });
      if (error) throw error;
      invalidateByPrefix('friend-search:');
      invalidate('friend-count');
      Alert.alert('בקשה נשלחה', `בקשת חברות נשלחה ל${candidate.display_name ?? 'משתמש/ת'}`);
    } catch (err: any) {
      const msg = err?.message?.includes('Cannot send request')
        ? 'לא ניתן לשלוח בקשה למשתמש/ת זה'
        : 'שגיאה בשליחת הבקשה';
      Alert.alert('שגיאה', msg);
    } finally {
      setSendingTo(null);
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Header — matches NotificationsSection / MyCoursesSection pattern */}
      <View style={styles.header}>
        <Ionicons name="people-outline" size={20} color={Colors.primary} />
        <Text style={styles.title}>חיפוש חברים</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="חפש לפי שם..."
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading && query.length > 0 && (
        <ActivityIndicator
          size="small"
          color={Colors.primary}
          style={styles.loader}
        />
      )}

      {results.map((candidate) => (
        <View key={candidate.id} style={styles.resultRow}>
          <View style={styles.resultInfo}>
            <Text style={styles.resultName}>
              {candidate.display_name ?? 'משתמש/ת'}
            </Text>
            {candidate.is_artist && (
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={Colors.primary}
              />
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.addButton,
              candidate.pending && styles.addButtonPending,
            ]}
            onPress={() => handleSendRequest(candidate)}
            disabled={candidate.pending || sendingTo === candidate.id}
          >
            {sendingTo === candidate.id ? (
              <ActivityIndicator size="small" color={Colors.text} />
            ) : (
              <Text
                style={[
                  styles.addButtonText,
                  candidate.pending && styles.addButtonTextPending,
                ]}
              >
                {candidate.pending ? 'נשלח' : 'הוסף'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ))}

      {query.length > 0 && !loading && results.length === 0 && (
        <Text style={styles.emptyText}>לא נמצאו תוצאות</Text>
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
    gap: 8,
    marginBottom: 12,
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    textAlign: 'right',
    padding: 0,
  },
  loader: {
    marginTop: 12,
  },
  resultRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resultInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  resultName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  addButtonPending: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addButtonText: {
    color: Colors.background,
    fontSize: 13,
    fontWeight: '700',
  },
  addButtonTextPending: {
    color: Colors.textMuted,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },
});
