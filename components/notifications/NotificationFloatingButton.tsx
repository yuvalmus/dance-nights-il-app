import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { useUnreadNotificationCount } from '@/hooks/useUnreadNotificationCount';

const BTN_SIZE = 44;

/**
 * Floating bell on the Dance tab. Mirrors DateToggle's BTN_SIZE/styling so
 * the top-left + top-right pair look coordinated. Hidden when the viewer is
 * signed out — anonymous users have nothing to notify.
 */
export default function NotificationFloatingButton() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { count } = useUnreadNotificationCount();

  if (!user) return null;

  const badgeLabel = count > 99 ? '99+' : count.toString();

  return (
    <View style={[styles.anchor, { top: insets.top + 8 }]} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.push('/notifications')}
        activeOpacity={0.8}
        accessibilityLabel="התראות"
      >
        <Ionicons name="notifications-outline" size={20} color={Colors.text} />
        {count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeLabel}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    left: 14,
    zIndex: 3,
  },
  btn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: { elevation: 6 },
    }),
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  badgeText: {
    color: Colors.background,
    fontSize: 10,
    fontWeight: '800',
  },
});
