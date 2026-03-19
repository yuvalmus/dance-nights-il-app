import { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { usePoll } from '@/hooks/usePoll';
import { PollModal } from './PollModal';

type Props = {
  date: string;
};

export function PollButton({ date }: Props) {
  const [visible, setVisible] = useState(false);
  const { poll, totalVotes } = usePoll(date);

  if (!poll) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setVisible(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="podium" size={22} color={Colors.background} />
        {totalVotes > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{totalVotes}</Text>
          </View>
        )}
      </TouchableOpacity>

      <PollModal
        date={date}
        visible={visible}
        onClose={() => setVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 160,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 20,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
