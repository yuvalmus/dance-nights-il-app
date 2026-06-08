import { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useNotifications } from '@/hooks/useNotifications';
import { useUnreadNotificationCount } from '@/hooks/useUnreadNotificationCount';
import BackButton from '@/components/ui/BackButton';
import NotificationListItem from '@/components/notifications/NotificationListItem';
import { NotificationFeedRow } from '@/types/database';

export default function NotificationsScreen() {
  const {
    notifications,
    unreadCount,
    loading,
    loadingMore,
    hasMore,
    markRead,
    markAllRead,
    loadMore,
    refetch,
  } = useNotifications();
  const { reset: resetBadge } = useUnreadNotificationCount();

  // The floating-button badge caches the unread count — sync it whenever
  // this screen's unread count changes so the badge doesn't lag behind.
  useEffect(() => {
    if (unreadCount === 0) resetBadge();
  }, [unreadCount, resetBadge]);

  const handleMarkAllRead = useCallback(async () => {
    await markAllRead();
    resetBadge();
  }, [markAllRead, resetBadge]);

  const renderItem = useCallback(
    ({ item }: { item: NotificationFeedRow }) => (
      <NotificationListItem
        notification={item}
        onMarkRead={markRead}
        onActionResolved={refetch}
      />
    ),
    [markRead, refetch],
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'התראות',
          headerRight: () => <BackButton />,
          headerLeft: () =>
            unreadCount > 0 ? (
              <TouchableOpacity onPress={handleMarkAllRead} hitSlop={8} style={styles.markAll}>
                <Text style={styles.markAllText}>סמן הכל כנקרא</Text>
              </TouchableOpacity>
            ) : null,
        }}
      />

      {loading && notifications.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>אין התראות כרגע</Text>
            </View>
          }
          ListFooterComponent={
            hasMore && loadingMore ? (
              <ActivityIndicator
                color={Colors.primary}
                size="small"
                style={styles.footerLoader}
              />
            ) : null
          }
          contentContainerStyle={
            notifications.length === 0 ? styles.emptyContainer : undefined
          }
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  markAll: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 15,
  },
  footerLoader: {
    paddingVertical: 16,
  },
});
