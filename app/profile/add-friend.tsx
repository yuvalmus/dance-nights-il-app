import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { useFriendSearch } from '@/hooks/useFriendSearch';
import { supabase } from '@/lib/supabase';
import { invalidate, invalidateByPrefix } from '@/lib/cache';
import FriendSearchResultRow from '@/components/social/FriendSearchResultRow';
import { TouchableOpacity } from 'react-native';

export default function AddFriendScreen() {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const { results, loading } = useFriendSearch(query);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: 'חיפוש חברים' });
  }, [navigation]);

  const handleSendRequest = useCallback(async (candidate: typeof results[0]) => {
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
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="חפש לפי שם..."
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.results}
        contentContainerStyle={styles.resultsContent}
        keyboardShouldPersistTaps="handled"
      >
        {loading && query.length > 0 && (
          <ActivityIndicator
            size="small"
            color={Colors.primary}
            style={styles.loader}
          />
        )}

        {results.map((candidate) => (
          <FriendSearchResultRow
            key={candidate.id}
            candidate={candidate}
            sending={sendingTo === candidate.id}
            onSendRequest={() => handleSendRequest(candidate)}
          />
        ))}

        {query.length > 0 && !loading && results.length === 0 && (
          <Text style={styles.emptyText}>לא נמצאו תוצאות</Text>
        )}

        {query.length === 0 && (
          <Text style={styles.hintText}>הקלד/י שם כדי לחפש חברים חדשים</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    textAlign: 'right',
    padding: 0,
  },
  results: {
    flex: 1,
  },
  resultsContent: {
    padding: 16,
  },
  loader: {
    marginTop: 20,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
  hintText: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
});
