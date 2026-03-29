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
import { DANCE_LEVELS, DANCE_LEVEL_LABELS } from '@/constants/config';
import FormInput from '@/components/ui/FormInput';
import PillSelect from '@/components/ui/PillSelect';
import { ScheduleEntryForm } from './types';

type Props = {
  schedules: ScheduleEntryForm[];
  initialExpanded: boolean;
  onAdd: () => void;
  onUpdate: (index: number, field: keyof ScheduleEntryForm, value: string) => void;
  onRemove: (index: number) => void;
};

const parseTimeToDate = (time: string): Date => {
  const [h, m] = (time || '20:00').split(':').map(Number);
  const d = new Date();
  d.setHours(h || 20, m || 0, 0, 0);
  return d;
};

const formatTime = (date: Date): string => {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

export default function ScheduleSection({ schedules, initialExpanded, onAdd, onUpdate, onRemove }: Props) {
  const [expanded, setExpanded] = useState(initialExpanded);
  const [showTimePicker, setShowTimePicker] = useState<number | null>(null);
  const scheduleCount = schedules.length;

  const handleAdd = () => {
    onAdd();
    setExpanded(true);
  };

  return (
    <View style={styles.sectionContainer}>
      <TouchableOpacity
        style={styles.collapsibleHeader}
        onPress={() => setExpanded(!expanded)}
      >
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-back'}
          size={20}
          color={Colors.textMuted}
        />
        <View style={styles.collapsibleTitleRow}>
          <Text style={styles.sectionTitle}>
            לוח זמנים{scheduleCount > 0 && !expanded ? ` (${scheduleCount})` : ''}
          </Text>
          {expanded && (
            <Text style={styles.sectionSubtitle}>הוסף את שעות האירוע</Text>
          )}
        </View>
      </TouchableOpacity>

      {expanded && (
        <>
          {schedules.map((entry, index) => (
            <View key={index} style={styles.scheduleRow}>
              <TouchableOpacity
                onPress={() => onRemove(index)}
                style={styles.removeBtn}
              >
                <Ionicons name="close-circle" size={20} color={Colors.error} />
              </TouchableOpacity>
              <View style={styles.scheduleFields}>
                <Text style={styles.fieldLabel}>שעה</Text>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setShowTimePicker(index)}
                >
                  <Ionicons name="time-outline" size={18} color={Colors.primary} />
                  <Text style={[styles.timeText, !entry.time && { color: Colors.textMuted }]}>
                    {entry.time || 'בחר שעה'}
                  </Text>
                </TouchableOpacity>

                {showTimePicker === index && (
                  <DateTimePicker
                    value={parseTimeToDate(entry.time)}
                    mode="time"
                    is24Hour
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_, selectedTime) => {
                      setShowTimePicker(Platform.OS === 'ios' ? index : null);
                      if (selectedTime) {
                        onUpdate(index, 'time', formatTime(selectedTime));
                      }
                    }}
                    themeVariant="dark"
                  />
                )}

                <FormInput
                  label="תיאור"
                  value={entry.description}
                  onChangeText={(v) => onUpdate(index, 'description', v)}
                  placeholder="שיעור בצאטה"
                />
                <Text style={styles.fieldLabel}>רמה</Text>
                <PillSelect
                  items={DANCE_LEVELS.map((l) => ({
                    value: l,
                    label: DANCE_LEVEL_LABELS[l],
                  }))}
                  selected={entry.level ? [entry.level] : []}
                  onToggle={(v) => onUpdate(index, 'level', entry.level === v ? '' : v)}
                />
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.addRow} onPress={handleAdd}>
            <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.addRowText}>הוסף שעה</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 24,
  },
  collapsibleHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  collapsibleTitleRow: {
    flex: 1,
    alignItems: 'flex-end',
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'right',
  },
  sectionSubtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'right',
    marginTop: 2,
  },
  fieldLabel: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 8,
  },
  timeButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  timeText: {
    color: Colors.text,
    fontSize: 15,
    flex: 1,
    textAlign: 'right',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surfaceLight || Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  scheduleFields: {
    flex: 1,
  },
  removeBtn: {
    padding: 4,
    marginTop: 4,
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
