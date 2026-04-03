import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';

type Props = {
  totalResults: number;
  onReset: () => void;
};

export function CourseResultsHeader({ totalResults, onReset }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.resetButton} onPress={onReset}>
        <MaterialCommunityIcons name="restart" size={14} color={Colors.primary} />
        <Text style={styles.resetText}>איפוס</Text>
      </TouchableOpacity>

      <Text style={styles.resultsText}>
        מציג את כל התוצאות ({totalResults})
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
