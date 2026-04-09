import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';

type Props = {
  outcomes: string[];
};

export default function CourseLearningSection({ outcomes }: Props) {
  if (outcomes.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>מה נלמד בקורס?</Text>
      <View style={styles.list}>
        {outcomes.map((text, i) => (
          <View key={i} style={styles.item}>
            <Text style={styles.itemText}>{text}</Text>
            <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 14,
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'right',
  },
  list: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  itemText: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
    marginLeft: 20,
  },
});
