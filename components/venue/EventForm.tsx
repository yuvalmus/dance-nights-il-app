import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import {
  DANCE_STYLES,
  DANCE_STYLE_LABELS,
  DANCE_LEVELS,
  DANCE_LEVEL_LABELS,
} from '@/constants/config';
import FormInput from '@/components/ui/FormInput';
import FormToggle from '@/components/ui/FormToggle';
import FormSection from '@/components/ui/FormSection';
import PillSelect from '@/components/ui/PillSelect';
import ActionButton from '@/components/ui/ActionButton';

export type ScheduleEntryForm = {
  time: string;
  description: string;
  level: string;
};

export type EventFormValues = {
  title: string;
  date: string;
  dance_styles: string[];
  schedules: ScheduleEntryForm[];
  posterUri: string | null; // local URI for new image, or existing URL
  posterChanged: boolean;
  price: string;
  price_note: string;
  dj: string;
  instructors: string[];
  pre_register: boolean;
  registration_link: string;
  spots_total: string;
  is_published: boolean;
  description: string;
};

const DEFAULT_VALUES: EventFormValues = {
  title: '',
  date: new Date().toISOString().split('T')[0],
  dance_styles: [],
  schedules: [],
  posterUri: null,
  posterChanged: false,
  price: '',
  price_note: '',
  dj: '',
  instructors: [],
  pre_register: false,
  registration_link: '',
  spots_total: '',
  is_published: true,
  description: '',
};

type EventFormProps = {
  initialValues?: Partial<EventFormValues>;
  onSubmit: (values: EventFormValues) => Promise<void>;
  onPickImage: () => Promise<string | null>;
  submitLabel: string;
  loading?: boolean;
  onSubmitRef?: React.MutableRefObject<(() => void) | null>;
};

export default function EventForm({
  initialValues,
  onSubmit,
  onPickImage,
  submitLabel,
  loading = false,
  onSubmitRef,
}: EventFormProps) {
  const [form, setForm] = useState<EventFormValues>({
    ...DEFAULT_VALUES,
    ...initialValues,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<number | null>(null);
  const [scheduleExpanded, setScheduleExpanded] = useState(
    (initialValues?.schedules?.length ?? 0) > 0,
  );
  const [newInstructor, setNewInstructor] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = <K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const toggleDanceStyle = (style: string) => {
    const current = form.dance_styles;
    const updated = current.includes(style)
      ? current.filter((s) => s !== style)
      : [...current, style];
    update('dance_styles', updated);
  };

  // Schedule management
  const addScheduleEntry = () => {
    update('schedules', [
      ...form.schedules,
      { time: '', description: '', level: '' },
    ]);
    setScheduleExpanded(true);
  };

  const updateScheduleEntry = (index: number, field: keyof ScheduleEntryForm, value: string) => {
    const updated = [...form.schedules];
    updated[index] = { ...updated[index], [field]: value };
    update('schedules', updated);
  };

  const removeScheduleEntry = (index: number) => {
    update('schedules', form.schedules.filter((_, i) => i !== index));
  };

  // Time picker helpers
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

  // Instructor management
  const addInstructor = () => {
    const name = newInstructor.trim();
    if (name && !form.instructors.includes(name)) {
      update('instructors', [...form.instructors, name]);
      setNewInstructor('');
    }
  };

  const removeInstructor = (name: string) => {
    update('instructors', form.instructors.filter((i) => i !== name));
  };

  // Image picker
  const handlePickImage = async () => {
    const uri = await onPickImage();
    if (uri) {
      setForm((prev) => ({ ...prev, posterUri: uri, posterChanged: true }));
    }
  };

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) newErrors.title = 'שדה חובה';
    if (!form.date) newErrors.date = 'שדה חובה';
    if (form.dance_styles.length === 0) newErrors.dance_styles = 'בחר לפחות סגנון אחד';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSubmit(form);
  };

  useEffect(() => {
    if (onSubmitRef) onSubmitRef.current = handleSubmit;
  });

  // Date helpers
  const dateObj = new Date(form.date + 'T00:00:00');
  const dateDisplay = dateObj.toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const danceStyleItems = DANCE_STYLES.map((s) => ({
    value: s,
    label: DANCE_STYLE_LABELS[s],
  }));

  const scheduleCount = form.schedules.length;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {/* Basic Info */}
      <FormSection title="פרטי אירוע">
        <FormInput
          label="כותרת"
          value={form.title}
          onChangeText={(t) => update('title', t)}
          placeholder="שם האירוע"
          error={errors.title}
        />

        <FormInput
          label="תיאור"
          value={form.description}
          onChangeText={(t) => update('description', t)}
          placeholder="תיאור קצר של האירוע"
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />

        {/* Date picker */}
        <Text style={styles.fieldLabel}>תאריך</Text>
        <TouchableOpacity
          style={[styles.dateButton, errors.date && styles.dateButtonError]}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
          <Text style={styles.dateText}>{dateDisplay}</Text>
        </TouchableOpacity>
        {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}

        {showDatePicker && (
          <DateTimePicker
            value={dateObj}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={new Date()}
            onChange={(_, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                update('date', selectedDate.toISOString().split('T')[0]);
              }
            }}
            themeVariant="dark"
          />
        )}
      </FormSection>

      {/* Dance Styles */}
      <FormSection title="סגנונות ריקוד">
        <PillSelect
          items={danceStyleItems}
          selected={form.dance_styles}
          onToggle={toggleDanceStyle}
        />
        {errors.dance_styles && (
          <Text style={[styles.errorText, { marginTop: 8 }]}>{errors.dance_styles}</Text>
        )}
      </FormSection>

      {/* Schedule — collapsible */}
      <View style={styles.sectionContainer}>
        <TouchableOpacity
          style={styles.collapsibleHeader}
          onPress={() => setScheduleExpanded(!scheduleExpanded)}
        >
          <Ionicons
            name={scheduleExpanded ? 'chevron-down' : 'chevron-back'}
            size={20}
            color={Colors.textMuted}
          />
          <View style={styles.collapsibleTitleRow}>
            <Text style={styles.sectionTitle}>
              לוח זמנים{scheduleCount > 0 && !scheduleExpanded ? ` (${scheduleCount})` : ''}
            </Text>
            {scheduleExpanded && (
              <Text style={styles.sectionSubtitle}>הוסף את שעות האירוע</Text>
            )}
          </View>
        </TouchableOpacity>

        {scheduleExpanded && (
          <>
            {form.schedules.map((entry, index) => (
              <View key={index} style={styles.scheduleRow}>
                <TouchableOpacity
                  onPress={() => removeScheduleEntry(index)}
                  style={styles.removeBtn}
                >
                  <Ionicons name="close-circle" size={20} color={Colors.error} />
                </TouchableOpacity>
                <View style={styles.scheduleFields}>
                  {/* Time picker button */}
                  <Text style={styles.fieldLabel}>שעה</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowTimePicker(index)}
                  >
                    <Ionicons name="time-outline" size={18} color={Colors.primary} />
                    <Text style={[styles.dateText, !entry.time && { color: Colors.textMuted }]}>
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
                          updateScheduleEntry(index, 'time', formatTime(selectedTime));
                        }
                      }}
                      themeVariant="dark"
                    />
                  )}

                  <FormInput
                    label="תיאור"
                    value={entry.description}
                    onChangeText={(v) => updateScheduleEntry(index, 'description', v)}
                    placeholder="שיעור בצאטה"
                  />
                  <Text style={styles.fieldLabel}>רמה</Text>
                  <PillSelect
                    items={DANCE_LEVELS.map((l) => ({
                      value: l,
                      label: DANCE_LEVEL_LABELS[l],
                    }))}
                    selected={entry.level ? [entry.level] : []}
                    onToggle={(v) => updateScheduleEntry(index, 'level', entry.level === v ? '' : v)}
                  />
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addRow} onPress={addScheduleEntry}>
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.addRowText}>הוסף שעה</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Poster */}
      <FormSection title="פוסטר">
        {form.posterUri ? (
          <View style={styles.posterPreview}>
            <Image source={{ uri: form.posterUri }} style={styles.posterImage} />
            <TouchableOpacity
              style={styles.posterRemove}
              onPress={() => setForm((prev) => ({ ...prev, posterUri: null, posterChanged: true }))}
            >
              <Ionicons name="close-circle" size={24} color={Colors.error} />
            </TouchableOpacity>
          </View>
        ) : null}
        <ActionButton
          label={form.posterUri ? 'החלף פוסטר' : 'בחר פוסטר'}
          variant="secondary"
          onPress={handlePickImage}
        />
      </FormSection>

      {/* Details */}
      <FormSection title="פרטים נוספים">
        {/* Price — narrow numeric field with ₪ */}
        <Text style={styles.fieldLabel}>מחיר</Text>
        <View style={styles.priceRow}>
          <Text style={styles.shekelPrefix}>₪</Text>
          <TextInput
            value={form.price}
            onChangeText={(v) => update('price', v.replace(/[^0-9]/g, ''))}
            placeholder="50"
            placeholderTextColor={Colors.textMuted}
            selectionColor={Colors.primary}
            keyboardType="number-pad"
            style={styles.priceTextInput}
          />
        </View>

        <FormInput
          label="הערת מחיר"
          value={form.price_note}
          onChangeText={(v) => update('price_note', v)}
          placeholder="הנחה לסטודנטים"
        />
        <FormInput
          label="DJ"
          value={form.dj}
          onChangeText={(v) => update('dj', v)}
          placeholder="שם ה-DJ"
        />

        {/* Instructors */}
        <Text style={styles.fieldLabel}>מדריכים</Text>
        <View style={styles.instructorTags}>
          {form.instructors.map((name) => (
            <TouchableOpacity
              key={name}
              style={styles.tag}
              onPress={() => removeInstructor(name)}
            >
              <Ionicons name="close" size={14} color={Colors.textSecondary} />
              <Text style={styles.tagText}>{name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.instructorInput}>
          <View style={{ flex: 1 }}>
            <FormInput
              label=""
              value={newInstructor}
              onChangeText={setNewInstructor}
              placeholder="שם מדריך"
              onSubmitEditing={addInstructor}
              returnKeyType="done"
            />
          </View>
          <TouchableOpacity style={styles.addInstructorBtn} onPress={addInstructor}>
            <Ionicons name="add" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </FormSection>

      {/* Registration */}
      <FormSection title="הרשמה">
        <FormToggle
          label="הרשמה מראש"
          description="נדרשת הרשמה לפני האירוע"
          value={form.pre_register}
          onValueChange={(v) => update('pre_register', v)}
        />
        {form.pre_register && (
          <FormInput
            label="מקישור הרשה"
            value={form.registration_link}
            onChangeText={(v) => update('registration_link', v)}
            placeholder="https://..."
            autoCapitalize="none"
            keyboardType="url"
            style={{textAlign: 'left'}}
          />
        )}
        <FormInput
          label="מספר מקומות"
          value={form.spots_total}
          onChangeText={(v) => update('spots_total', v)}
          placeholder="השאר ריק אם ללא הגבלה"
          keyboardType="number-pad"
        />
      </FormSection>

      {/* Visibility */}
      <FormSection title="פרסום">
        <FormToggle
          label="פרסום אירוע"
          description="האירוע יופיע במפה לכל המשתמשים"
          value={form.is_published}
          onValueChange={(v) => update('is_published', v)}
        />
      </FormSection>

      {/* Submit */}
      <ActionButton
        label={submitLabel}
        onPress={handleSubmit}
        loading={loading}
      />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  fieldLabel: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 8,
  },
  dateButton: {
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
  dateButtonError: {
    borderColor: Colors.error,
  },
  dateText: {
    color: Colors.text,
    fontSize: 15,
    flex: 1,
    textAlign: 'right',
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    textAlign: 'right',
  },
  // Collapsible schedule section
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
  // Schedule
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
  // Price
  priceRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    width: '40%',
    alignSelf: 'flex-end',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  shekelPrefix: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  priceTextInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    textAlign: 'right',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  // Poster
  posterPreview: {
    position: 'relative',
    marginBottom: 12,
  },
  posterImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  posterRemove: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  // Instructors
  instructorTags: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tag: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    color: Colors.text,
    fontSize: 13,
  },
  instructorInput: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    gap: 8,
  },
  addInstructorBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
});
