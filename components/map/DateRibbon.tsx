import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { DATE_RIBBON_DAYS } from '@/constants/config';

type Props = {
  selectedDate: string;
  onDateSelect: (date: string) => void;
};

const DAY_NAMES_HE = ['יום א׳', 'יום ב׳', 'יום ג׳', 'יום ד׳', 'יום ה׳', 'יום ו׳', 'שבת'];

function getDates(count: number): { date: string; dayName: string; dayNum: number; isToday: boolean }[] {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      date: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'היום' : DAY_NAMES_HE[d.getDay()],
      dayNum: d.getDate(),
      isToday: i === 0,
    });
  }
  return dates;
}

export function DateRibbon({ selectedDate, onDateSelect }: Props) {
  const dates = getDates(DATE_RIBBON_DAYS);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {dates.map((item) => {
          const isSelected = selectedDate === item.date;
          return (
            <TouchableOpacity
              key={item.date}
              style={[styles.dateItem, isSelected && styles.dateItemSelected]}
              onPress={() => onDateSelect(item.date)}
            >
              <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                {item.dayName}
              </Text>
              <Text style={[styles.dayNum, isSelected && styles.dayNumSelected]}>
                {item.dayNum}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    paddingVertical: 8,
  },
  scroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  dateItem: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    minWidth: 56,
  },
  dateItemSelected: {
    backgroundColor: Colors.primary,
  },
  dayName: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  dayNameSelected: {
    color: Colors.background,
  },
  dayNum: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  dayNumSelected: {
    color: Colors.background,
  },
});
