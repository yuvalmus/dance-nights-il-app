import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationRow from './NotificationRow';

const COLLAPSED_LIMIT = 3;

export default function NotificationsSection() {
  const { notifications, unreadCount, markRead, markAllRead, loading } = useNotifications();
  const [expanded, setExpanded] = useState(false);

  if (loading || notifications.length === 0) return null;

  const visible = expanded ? notifications : notifications.slice(0, COLLAPSED_LIMIT);
  const hasMore = notifications.length > COLLAPSED_LIMIT;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
          <Text style={styles.title}>התראות</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity onPress={() => { void markAllRead(); }}>
            <Text style={styles.markAllText}>סמן הכל כנקרא</Text>
          </TouchableOpacity>
        )}
      </View>

      {visible.map((n) => (
        <NotificationRow
          key={n.id}
          notification={n}
          onPress={(id) => { void markRead(id); }}
        />
      ))}

      {hasMore && (
        <TouchableOpacity
          style={styles.expandBtn}
          onPress={() => setExpanded((v) => !v)}
        >
          <Text style={styles.expandText}>
            {expanded ? 'הצג פחות' : `הצג עוד (${notifications.length - COLLAPSED_LIMIT})`}
          </Text>
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: '700',
  },
  markAllText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  expandBtn: {
    marginTop: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  expandText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
