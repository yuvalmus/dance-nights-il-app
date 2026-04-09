import { useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useCourses } from '@/hooks/useCourses';
import { CourseCard } from '@/components/courses/CourseCard';
import { CourseResultsHeader } from '@/components/courses/CourseResultsHeader';
import { CourseFiltersSheet, FiltersSheetRef } from '@/components/courses/CourseFiltersSheet';
import SearchBar from '@/components/ui/SearchBar';
import { CourseFilters, DEFAULT_COURSE_FILTERS } from '@/types/courseFilters';

export default function CoursesScreen() {
  const router = useRouter();
  const [filters, setFilters] = useState<CourseFilters>(DEFAULT_COURSE_FILTERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const filtersSheetRef = useRef<FiltersSheetRef>(null);

  const { courses, allCount, getInstructorsForType, loading } = useCourses(filters, searchQuery);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.levels.length > 0) count++;
    if (filters.instructors.length > 0) count++;
    if (filters.fromDate) count++;
    return count;
  }, [filters]);

  const handleApplyFilters = useCallback((next: CourseFilters) => {
    setFilters(next);
    setSheetOpen(false);
  }, []);

  const handleReset = useCallback(() => {
    setSearchQuery('');
    setFilters(DEFAULT_COURSE_FILTERS);
  }, []);

  const handleFilterPress = useCallback(() => {
    setSheetOpen(true);
  }, []);

  const handleSheetClose = useCallback(() => {
    setSheetOpen(false);
  }, []);

  // Close filter sheet when navigating away
  useFocusEffect(
    useCallback(() => {
      return () => setSheetOpen(false);
    }, []),
  );

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

      <View style={styles.divider} />

      {/* Results header */}
      <CourseResultsHeader
        totalResults={courses.length}
        activeFilterCount={activeFilterCount}
        onReset={handleReset}
      />

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
          renderItem={({ item }) => (
            <CourseCard
              course={item}
              onPress={() => router.push({ pathname: '/course/details', params: { courseId: item.id } })}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.empty}>אין תוצאות להצגה</Text>
          }
        />
      )}

      {/* Filter bottom sheet — only mounted when open to avoid gesture blocking */}
      {sheetOpen && (
        <CourseFiltersSheet
          ref={filtersSheetRef}
          filters={filters}
          onApply={handleApplyFilters}
          onClose={handleSheetClose}
          resultCount={courses.length}
          getInstructorsForType={getInstructorsForType}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'right',
    marginBottom: 20,
    paddingHorizontal: 13,
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
