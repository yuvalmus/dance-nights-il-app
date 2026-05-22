import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';

type Props = {
  isGoing: boolean;
  onToggle: () => void;
  loading: boolean;
};

export default function GoingToggle({ isGoing, onToggle, loading }: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, isGoing && styles.buttonActive]}
      onPress={onToggle}
      activeOpacity={0.7}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.text} />
      ) : (
        <>
          <Text style={[styles.label, isGoing && styles.labelActive]}>
            {isGoing ? 'מסומן/ת' : 'אני הולך/ת'}
          </Text>
          <Ionicons
            name={isGoing ? 'checkmark-circle' : 'add-circle-outline'}
            size={18}
            color={isGoing ? Colors.primary : Colors.textSecondary}
          />
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  buttonActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(212, 160, 23, 0.12)',
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  labelActive: {
    color: Colors.primary,
  },
});
