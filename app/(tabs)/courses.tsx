import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useCourses } from '@/hooks/useCourses';
import { CourseCard } from '@/components/courses/CourseCard';
import { CourseResultsHeader } from '@/components/courses/CourseResultsHeader';
import PillSelect from '@/components/ui/PillSelect';
import SearchBar from '@/components/ui/SearchBar';
import { CourseType } from '@/constants/config';

const TAB_ITEMS = [
  { value: 'course', label: 'קורסים' },
  { value: 'bootcamp', label: 'בוטקמפ' },
  { value: 'festival', label: 'פסטיבלים' },
];

export default function CoursesScreen() {
  const [selectedTab, setSelectedTab] = useState<CourseType>('course');
  const [searchQuery, setSearchQuery] = useState('');
  const { courses, allCount, loading } = useCourses(selectedTab, searchQuery);

  const handleTabToggle = (value: string) => {
    if (value) setSelectedTab(value as CourseType);
  };

  const handleReset = useCallback(() => {
    setSearchQuery('');
    setSelectedTab('course');
  }, []);

  const handleFilterPress = () => {
    // TODO: Open filter bottom sheet (next task)
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>העשרה ופסטיבלים</Text>

      {/* Search bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="חיפוש קורס או סגנון..."
        onFilterPress={handleFilterPress}
      />

      {/* Type filter pills */}
      <View style={styles.tabs}>
        <PillSelect
          items={TAB_ITEMS}
          selected={[selectedTab]}
          onToggle={handleTabToggle}
          mode="single"
          allowEmpty={false}
        />
      </View>

      <View style={styles.divider} />

      {/* Results header */}
      <CourseResultsHeader totalResults={allCount} onReset={handleReset} />

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
            <Text style={styles.empty}>אין תוצאות להצגה</Text>
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
    padding: 5
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'right',
    marginBottom: 20,
    paddingHorizontal: 13,
  },
  tabs: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
    marginTop: 22,
    marginBottom: 12,
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
