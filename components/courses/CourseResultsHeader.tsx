import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';

type Props = {
  totalResults: number;
  activeFilterCount: number;
  onReset: () => void;
};

export function CourseResultsHeader({ totalResults, activeFilterCount, onReset }: Props) {
  const showReset = activeFilterCount > 0;

  return (
    <View style={styles.container}>
      {showReset ? (
        <TouchableOpacity style={styles.resetButton} onPress={onReset}>
          <MaterialCommunityIcons name="restart" size={14} color={Colors.primary} />
          <Text style={styles.resetText}>איפוס מסננים ({activeFilterCount})</Text>
        </TouchableOpacity>
      ) : (
        <View />
      )}

      <Text style={styles.resultsText}>
        מציג {totalResults} תוצאות
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  resultsText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  resetButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  resetText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
