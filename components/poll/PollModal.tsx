import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { usePoll } from '@/hooks/usePoll';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'expo-router';

type Props = {
  date: string;
  visible: boolean;
  onClose: () => void;
};

export function PollModal({ date, visible, onClose }: Props) {
  const { poll, hasVoted, vote, votingLoading, totalVotes } = usePoll(date);
  const { user } = useAuth();
  const router = useRouter();

  if (!poll) return null;

  const handleVote = async (optionId: string) => {
    if (!user) {
      onClose();
      router.push('/(auth)/login');
      return;
    }
    await vote(optionId);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>{poll.title}</Text>
          </View>

          {poll.poll_options
            ?.sort((a, b) => a.sort_order - b.sort_order)
            .map((option) => {
              const voteCount = option.poll_votes?.[0]?.count ?? 0;
              const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

              return (
                <TouchableOpacity
                  key={option.id}
                  style={styles.option}
                  onPress={() => handleVote(option.id)}
                  disabled={hasVoted || votingLoading}
                >
                  {hasVoted && (
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${percentage}%` },
                      ]}
                    />
                  )}

                  <Text style={styles.optionLabel}>{option.label}</Text>
                  {hasVoted && (
                    <Text style={styles.optionCount}>
                      {voteCount} ({Math.round(percentage)}%)
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}

          <Text style={styles.footer}>
            {hasVoted
              ? `${totalVotes} הצבעות`
              : user
              ? 'בחר/י את ההצבעה שלך'
              : 'התחבר/י כדי להצביע'}
          </Text>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  option: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(212, 160, 23, 0.15)',
    borderRadius: 12,
  },
  optionLabel: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  optionCount: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
    fontSize: 13,
  },
});
