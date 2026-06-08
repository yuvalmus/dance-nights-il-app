import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { ActivityFriend } from '@/hooks/useActivitySocial';
import DancerAvatar from './DancerAvatar';

type Props = {
  friend: ActivityFriend;
};

/** A single friend in the "friends going" list — avatar + name, no actions. */
export default function FriendGoingRow({ friend }: Props) {
  return (
    <View style={styles.row}>
      <DancerAvatar size={40} />
      <Text style={styles.name} numberOfLines={1}>
        {friend.display_name || 'חבר'}
      </Text>
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
  name: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
  },
});
