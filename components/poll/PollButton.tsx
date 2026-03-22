import { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { usePoll } from '@/hooks/usePoll';
import { PollModal } from './PollModal';

type Props = {
  date: string;
};

export function PollButton({ date }: Props) {
  const [visible, setVisible] = useState(false);
  const { poll } = usePoll(date);

  if (!poll) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setVisible(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="podium" size={16} color={Colors.background} />
        <Text style={styles.label}>איפה רוקדים היום?</Text>
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
  button: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  label: {
    color: Colors.background,
    fontSize: 13,
    fontWeight: '700',
  },
});
