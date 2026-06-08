import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useCallback } from 'react';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { useMyFriends } from '@/hooks/useMyFriends';
import { usePendingRequests } from '@/hooks/usePendingRequests';
import { supabase } from '@/lib/supabase';
import { invalidate } from '@/lib/cache';
import FriendRow from '@/components/social/FriendRow';
import PendingRequestRow from '@/components/social/PendingRequestRow';

export default function FriendsScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { friends, loading, refetch } = useMyFriends();
  const { requests, loading: reqLoading, refetch: refetchReqs } = usePendingRequests();

  useEffect(() => {
    navigation.setOptions({
      title: 'החברים שלי',
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => router.push('/profile/add-friend')}
          hitSlop={8}
          style={styles.headerAddBtn}
        >
          <Ionicons name="person-add-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, router]);

  const handleRemove = useCallback(async (targetId: string, name: string | null) => {
    Alert.alert(
      'הסרת חבר/ה',
      `להסיר את ${name ?? 'חבר/ה'} מרשימת החברים?`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'הסר',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.rpc('remove_friendship_record', { target_id: targetId });
              if (error) throw error;
              invalidate('friend-count');
              refetch();
            } catch {
              Alert.alert('שגיאה', 'לא הצלחנו להסיר את החבר/ה.');
            }
          },
        },
      ],
    );
  }, [refetch]);

  const handleAccept = useCallback(async (requesterId: string) => {
    try {
      const { error } = await supabase.rpc('accept_friend', { requester_id: requesterId });
      if (error) throw error;
      invalidate('friend-count');
      refetch();
      refetchReqs();
    } catch {
      Alert.alert('שגיאה', 'לא הצלחנו לאשר את הבקשה.');
    }
  }, [refetch, refetchReqs]);

  const handleDecline = useCallback(async (requesterId: string) => {
    try {
      const { error } = await supabase.rpc('remove_friendship_record', { target_id: requesterId });
      if (error) throw error;
      refetchReqs();
    } catch {
      Alert.alert('שגיאה', 'לא הצלחנו לדחות את הבקשה.');
    }
  }, [refetchReqs]);

  if (loading || reqLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Pending requests */}
      {requests.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="mail-outline" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>
              בקשות חברות ({requests.length})
            </Text>
          </View>
          {requests.map((r) => (
            <PendingRequestRow
              key={r.id}
              request={r}
              onAccept={() => handleAccept(r.id)}
              onDecline={() => handleDecline(r.id)}
            />
          ))}
        </View>
      )}

      {/* Friends list */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="people-outline" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>
            חברים ({friends.length})
          </Text>
        </View>

        {friends.length === 0 ? (
          <Text style={styles.emptyText}>
            עדיין אין חברים. לחצ/י על הכפתור למעלה כדי לחפש חברים!
          </Text>
        ) : (
          friends.map((f) => (
            <FriendRow
              key={f.id}
              friend={f}
              onRemove={() => handleRemove(f.id, f.display_name)}
            />
          ))
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
  headerAddBtn: {
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
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
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
