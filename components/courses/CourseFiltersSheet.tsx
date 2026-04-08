import React, { useCallback, useMemo, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Colors } from '@/constants/colors';
import { CourseType, DANCE_LEVEL_LABELS } from '@/constants/config';
import { Ionicons } from '@/components/ui/Icon';
import PillSelect from '@/components/ui/PillSelect';
import CollapsiblePills from '@/components/ui/CollapsiblePills';
import { FilterSection } from '@/components/courses/FilterSection';
import { CourseFilters, DEFAULT_COURSE_FILTERS } from '@/types/courseFilters';
import { formatCourseDateRange } from '@/lib/date';

export type FiltersSheetRef = {
  open: () => void;
  close: () => void;
};

type Props = {
  filters: CourseFilters;
  onApply: (filters: CourseFilters) => void;
  onClose: () => void;
  resultCount: number;
  getInstructorsForType: (type: CourseType) => string[];
};

const SCREEN_HEIGHT = Dimensions.get('window').height;

const TYPE_ITEMS = [
  { value: 'course', label: 'קורסים' },
  { value: 'bootcamp', label: 'בוטקמפ' },
  { value: 'festival', label: 'פסטיבלים' },
];

const LEVEL_ITEMS = Object.entries(DANCE_LEVEL_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const CourseFiltersSheet = forwardRef<FiltersSheetRef, Props>(
  ({ filters, onApply, onClose, resultCount, getInstructorsForType }, ref) => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const [draft, setDraft] = useState<CourseFilters>(filters);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const snapPoints = useMemo(() => [SCREEN_HEIGHT * 0.85], []);

    useImperativeHandle(ref, () => ({
      open() {
        setDraft(filters);
        bottomSheetRef.current?.snapToIndex(0);
      },
      close() {
        bottomSheetRef.current?.close();
      },
    }), [filters]);

    const handleSheetChange = useCallback((index: number) => {
      if (index === -1) onClose();
    }, [onClose]);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
      ),
      [],
    );

    const hasActiveFilters = draft.levels.length > 0 || draft.instructors.length > 0 || draft.fromDate !== null;

    const instructorItems = useMemo(
      () => getInstructorsForType(draft.type).map((name) => ({ value: name, label: name })),
      [getInstructorsForType, draft.type],
    );

    const handleTypeToggle = useCallback((value: string) => {
      if (!value) return;
      setDraft((prev) => ({
        ...prev,
        type: value as CourseFilters['type'],
        levels: [],
        instructors: [],
        fromDate: null,
      }));
    }, []);

    const handleLevelToggle = useCallback((value: string) => {
      setDraft((prev) => {
        const isSelected = prev.levels.includes(value);
        const levels = isSelected
          ? prev.levels.filter((l) => l !== value)
          : [...prev.levels, value];
        return { ...prev, levels };
      });
    }, []);

    const handleInstructorToggle = useCallback((value: string) => {
      setDraft((prev) => {
        const isSelected = prev.instructors.includes(value);
        const instructors = isSelected
          ? prev.instructors.filter((i) => i !== value)
          : [...prev.instructors, value];
        return { ...prev, instructors };
      });
    }, []);

    const handleDateChange = useCallback((_event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === 'android') setShowDatePicker(false);
      if (date) {
        const iso = date.toISOString().split('T')[0];
        setDraft((prev) => ({ ...prev, fromDate: iso }));
      }
    }, []);

    const clearDate = useCallback(() => {
      setDraft((prev) => ({ ...prev, fromDate: null }));
      setShowDatePicker(false);
    }, []);

    const handleClearAll = useCallback(() => {
      setDraft(DEFAULT_COURSE_FILTERS);
    }, []);

    const handleApply = useCallback(() => {
      onApply(draft);
      bottomSheetRef.current?.close();
    }, [draft, onApply]);

    const fromDateLabel = draft.fromDate
      ? formatCourseDateRange([draft.fromDate])
      : null;

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose
        onChange={handleSheetChange}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.indicator}
      >
        <BottomSheetScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClearAll} disabled={!hasActiveFilters}>
              <Text style={[styles.clearText, !hasActiveFilters && styles.clearTextDisabled]}>
                נקה הכל
              </Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>סינון</Text>
          </View>

          {/* Type */}
          <FilterSection title="סוג">
            <PillSelect
              items={TYPE_ITEMS}
              selected={[draft.type]}
              onToggle={handleTypeToggle}
              mode="single"
              allowEmpty={false}
            />
          </FilterSection>

          {/* Level — visible for courses & bootcamps */}
          {draft.type !== 'festival' && (
            <FilterSection title="רמה">
              <PillSelect
                items={LEVEL_ITEMS}
                selected={draft.levels}
                onToggle={handleLevelToggle}
                mode="multi"
                allowEmpty
              />
            </FilterSection>
          )}

          {/* Instructors */}
          {instructorItems.length > 0 && (
            <FilterSection title="מדריך">
              <CollapsiblePills
                items={instructorItems}
                selected={draft.instructors}
                onToggle={handleInstructorToggle}
              />
            </FilterSection>
          )}

          {/* From date */}
          <FilterSection title="מתחיל החל מתאריך">
            <View style={styles.dateRow}>
              {draft.fromDate && (
                <TouchableOpacity onPress={clearDate} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.datePicker, showDatePicker && styles.datePickerActive]}
                onPress={() => setShowDatePicker((prev) => !prev)}
              >
                <Ionicons name="calendar-outline" size={16} color={showDatePicker ? Colors.primary : Colors.textSecondary} />
                <Text style={[styles.dateText, showDatePicker && styles.dateTextActive]}>
                  {fromDateLabel ?? 'בחר תאריך'}
                </Text>
              </TouchableOpacity>
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={draft.fromDate ? new Date(draft.fromDate) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
                themeVariant="dark"
              />
            )}
          </FilterSection>

          {/* Apply button */}
          <TouchableOpacity style={styles.applyButton} onPress={handleApply} activeOpacity={0.8}>
            <Text style={styles.applyText}>
              החל סינון
            </Text>
          </TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  background: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  indicator: {
    backgroundColor: Colors.textMuted,
    width: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  clearText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  clearTextDisabled: {
    opacity: 0.3,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  datePicker: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  datePickerActive: {
    borderColor: Colors.primary,
  },
  dateText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  dateTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  applyText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '800',
  },
});
