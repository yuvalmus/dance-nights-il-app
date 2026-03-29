import { useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useCourses } from '@/hooks/useCourses';
import { CourseCard } from '@/components/courses/CourseCard';
import PillSelect from '@/components/ui/PillSelect';
import { CourseType } from '@/constants/config';

const TAB_ITEMS = [
  { value: 'all', label: 'הכל' },
  { value: 'course', label: 'קורסים' },
  { value: 'bootcamp', label: 'בוטקמפ' },
  { value: 'festival', label: 'פסטיבלים' },
];

export default function CoursesScreen() {
  const [selectedTab, setSelectedTab] = useState<CourseType | null>(null);
  const { courses, loading } = useCourses(selectedTab);

  const handleTabToggle = (value: string) => {
    setSelectedTab(value === 'all' || value === '' ? null : value as CourseType);
  };

  const selectedPill = selectedTab ?? 'all';

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>קורסים ופסטיבלים</Text>

      {/* Filter tabs */}
      <View style={styles.tabs}>
        <PillSelect
          items={TAB_ITEMS}
          selected={[selectedPill]}
          onToggle={handleTabToggle}
          mode="single"
        />
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={styles.loader}
        />
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CourseCard course={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.empty}>אין קורסים להצגה</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'right',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  tabs: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  loader: {
    marginTop: 40,
  },
  empty: {
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});
