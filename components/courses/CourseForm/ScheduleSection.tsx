import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import FormInput from '@/components/ui/FormInput';
import { CourseScheduleForm } from './types';

type Props = {
  schedules: CourseScheduleForm[];
  errors: Record<string, string>;
  onAdd: () => void;
  onUpdate: (index: number, field: keyof CourseScheduleForm, value: string) => void;
  onRemove: (index: number) => void;
};

type PickerField = 'date' | 'start_time' | 'end_time';
type ActivePicker = null | { index: number; field: PickerField };

function parseDateISO(d: string): Date {
  return new Date((d || new Date().toISOString().split('T')[0]) + 'T00:00:00');
}

function parseTime(t: string): Date {
  const [h, m] = (t || '20:00').split(':').map(Number);
  const d = new Date();
  d.setHours(h || 20, m || 0, 0, 0);
  return d;
}

function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return 'בחר תאריך';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('he-IL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export default function ScheduleSection({
  schedules,
  errors,
  onAdd,
  onUpdate,
  onRemove,
}: Props) {
  const [expanded, setExpanded] = useState(schedules.length > 0);
  const [active, setActive] = useState<ActivePicker>(null);

  const handleAdd = () => {
    onAdd();
    setExpanded(true);
  };

  const closePicker = () => setActive(null);

  const onPickerChange = (
    index: number,
    field: 'date' | 'start_time' | 'end_time',
    selected: Date | undefined,
  ) => {
    // iOS: picker stays visible; Android: dismiss immediately.
    if (Platform.OS !== 'ios') closePicker();
    if (!selected) return;
    if (field === 'date') {
      onUpdate(index, 'date', selected.toISOString().split('T')[0]);
    } else {
      onUpdate(index, field, formatTime(selected));
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((prev) => !prev)}
      >
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-back'}
          size={20}
          color={Colors.textMuted}
        />
        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>
            מפגשים{schedules.length > 0 && !expanded ? ` (${schedules.length})` : ''}
          </Text>
          {expanded && (
            <Text style={styles.subtitle}>הוסף את תאריכי ושעות המפגשים</Text>
          )}
        </View>
      </TouchableOpacity>

      {expanded && (
        <>
          {schedules.map((entry, index) => {
            const isActiveField = (f: PickerField) =>
              active?.index === index && active?.field === f;
            return (
              <View key={index} style={styles.row}>
                <TouchableOpacity
                  onPress={() => onRemove(index)}
                  style={styles.removeBtn}
                >
                  <Ionicons name="close-circle" size={20} color={Colors.error} />
                </TouchableOpacity>
                <View style={styles.fields}>
                  {/* Date */}
                  <Text style={styles.fieldLabel}>תאריך</Text>
                  <TouchableOpacity
                    style={[
                      styles.pickerButton,
                      errors[`schedule_${index}_date`] && styles.pickerButtonError,
                      isActiveField('date') && styles.pickerButtonActive,
                    ]}
                    onPress={() =>
                      setActive((prev) =>
                        prev?.index === index && prev.field === 'date'
                          ? null
                          : { index, field: 'date' },
                      )
                    }
                  >
                    <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                    <Text
                      style={[
                        styles.pickerText,
                        !entry.date && { color: Colors.textMuted },
                        isActiveField('date') && styles.pickerTextActive,
                      ]}
                    >
                      {formatDateDisplay(entry.date)}
                    </Text>
                  </TouchableOpacity>

                  {isActiveField('date') && (
                    <DateTimePicker
                      value={parseDateISO(entry.date)}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(_, d) => onPickerChange(index, 'date', d)}
                      themeVariant="dark"
                    />
                  )}

                  {/* Time range */}
                  <View style={styles.timeRow}>
                    <View style={styles.timeField}>
                      <Text style={styles.fieldLabel}>שעת התחלה</Text>
                      <TouchableOpacity
                        style={[
                          styles.pickerButton,
                          errors[`schedule_${index}_start_time`] && styles.pickerButtonError,
                          isActiveField('start_time') && styles.pickerButtonActive,
                        ]}
                        onPress={() =>
                          setActive((prev) =>
                            prev?.index === index && prev.field === 'start_time'
                              ? null
                              : { index, field: 'start_time' },
                          )
                        }
                      >
                        <Ionicons name="time-outline" size={18} color={Colors.primary} />
                        <Text
                          style={[
                            styles.pickerText,
                            !entry.start_time && { color: Colors.textMuted },
                            isActiveField('start_time') && styles.pickerTextActive,
                          ]}
                        >
                          {entry.start_time || 'בחר'}
                        </Text>
                      </TouchableOpacity>
                      {isActiveField('start_time') && (
                        <DateTimePicker
                          value={parseTime(entry.start_time)}
                          mode="time"
                          is24Hour
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          onChange={(_, d) => onPickerChange(index, 'start_time', d)}
                          themeVariant="dark"
                        />
                      )}
                    </View>

                    <View style={styles.timeField}>
                      <Text style={styles.fieldLabel}>שעת סיום</Text>
                      <TouchableOpacity
                        style={[
                          styles.pickerButton,
                          errors[`schedule_${index}_end_time`] && styles.pickerButtonError,
                          isActiveField('end_time') && styles.pickerButtonActive,
                        ]}
                        onPress={() =>
                          setActive((prev) =>
                            prev?.index === index && prev.field === 'end_time'
                              ? null
                              : { index, field: 'end_time' },
                          )
                        }
                      >
                        <Ionicons name="time-outline" size={18} color={Colors.primary} />
                        <Text
                          style={[
                            styles.pickerText,
                            !entry.end_time && { color: Colors.textMuted },
                            isActiveField('end_time') && styles.pickerTextActive,
                          ]}
                        >
                          {entry.end_time || 'בחר'}
                        </Text>
                      </TouchableOpacity>
                      {isActiveField('end_time') && (
                        <DateTimePicker
                          value={parseTime(entry.end_time)}
                          mode="time"
                          is24Hour
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          onChange={(_, d) => onPickerChange(index, 'end_time', d)}
                          themeVariant="dark"
                        />
                      )}
                    </View>
                  </View>

                  <FormInput
                    label="תיאור (אופציונלי)"
                    value={entry.description}
                    onChangeText={(v) => onUpdate(index, 'description', v)}
                    placeholder="מה נלמד במפגש?"
                  />
                </View>
              </View>
            );
          })}
          <TouchableOpacity style={styles.addRow} onPress={handleAdd}>
            <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.addRowText}>הוסף מפגש</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'right',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'right',
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surfaceLight || Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  fields: {
    flex: 1,
  },
  removeBtn: {
    padding: 4,
    marginTop: 4,
  },
  fieldLabel: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  pickerButtonError: {
    borderColor: Colors.error,
  },
  pickerButtonActive: {
    borderColor: Colors.primary,
  },
  pickerText: {
    color: Colors.text,
    fontSize: 15,
    flex: 1,
    textAlign: 'right',
  },
  pickerTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  timeField: {
    flex: 1,
  },
  addRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  addRowText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
