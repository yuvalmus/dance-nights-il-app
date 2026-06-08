import { ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { NotificationType } from '@/types/database';
import { formatRelativeHe, iconForNotificationType } from '@/lib/notificationCopy';

type Props = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  sortAt: string;
  unread: boolean;
  /** Optional leading visual — replaces the type icon (e.g. avatar stack). */
  leading?: ReactNode;
  /** Optional inline-action trailing block rendered below the body. */
  actions?: ReactNode;
  onPress?: () => void;
};

/**
 * Shared layout for inbox rows. Each row variant composes this with its own
 * leading visual / inline actions; the time stamp, unread badge and icon
 * behave identically across variants, so they live here.
 */
export default function NotificationRowBase({
  type,
  title,
  body,
  sortAt,
  unread,
  leading,
  actions,
  onPress,
}: Props) {
  const Wrapper: any = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      style={({ pressed }: { pressed?: boolean } = {}) => [
        styles.container,
        unread && styles.unread,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.leading}>
        {leading ?? (
          <Ionicons
            name={iconForNotificationType(type) as any}
            size={22}
            color={unread ? Colors.primary : Colors.textSecondary}
          />
        )}
      </View>

      <View style={styles.body}>
        <Text style={[styles.title, unread && styles.titleUnread]} numberOfLines={2}>
          {title}
        </Text>
        {body ? (
          <Text style={styles.message} numberOfLines={3}>
            {body}
          </Text>
        ) : null}
        <Text style={styles.time}>{formatRelativeHe(sortAt)}</Text>
        {actions ? <View style={styles.actionsRow}>{actions}</View> : null}
      </View>

      {unread && <View style={styles.dot} />}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pressed: {
    opacity: 0.7,
  },
  unread: {
    backgroundColor: Colors.surfaceLight,
  },
  leading: {
    width: 38,
    alignItems: 'center',
    paddingTop: 2,
  },
  body: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  titleUnread: {
    fontWeight: '700',
  },
  message: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
    textAlign: 'right',
  },
  time: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row-reverse',
    alignSelf: 'stretch',
    gap: 8,
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 6,
  },
});
