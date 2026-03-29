import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { DANCE_STYLES, DANCE_STYLE_LABELS } from '@/constants/config';
import FormInput from '@/components/ui/FormInput';
import FormSection from '@/components/ui/FormSection';
import FormToggle from '@/components/ui/FormToggle';
import PillSelect from '@/components/ui/PillSelect';
import ActionButton from '@/components/ui/ActionButton';

import { EventFormProps } from './types';
import { useEventForm } from './useEventForm';
import ScheduleSection from './ScheduleSection';
import PosterSection from './PosterSection';
import DetailsSection from './DetailsSection';
import RegistrationSection from './RegistrationSection';

import { useState } from 'react';

export default function EventForm({
  initialValues,
  onSubmit,
  onPickImage,
  submitLabel,
  loading = false,
  onSubmitRef,
}: EventFormProps) {
  const {
    form,
    setForm,
    errors,
    update,
    toggleDanceStyle,
    addScheduleEntry,
    updateScheduleEntry,
    removeScheduleEntry,
    handleSubmit,
  } = useEventForm(initialValues, onSubmit, onSubmitRef);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const handlePickImage = async () => {
    const uri = await onPickImage();
    if (uri) {
      setForm((prev) => ({ ...prev, posterUri: uri, posterChanged: true }));
    }
  };

  const handleRemovePoster = () => {
    setForm((prev) => ({ ...prev, posterUri: null, posterChanged: true }));
  };

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

      {/* Schedule */}
      <ScheduleSection
        schedules={form.schedules}
        initialExpanded={(initialValues?.schedules?.length ?? 0) > 0}
        onAdd={addScheduleEntry}
        onUpdate={updateScheduleEntry}
        onRemove={removeScheduleEntry}
      />

      {/* Poster */}
      <PosterSection
        posterUri={form.posterUri}
        onPickImage={handlePickImage}
        onRemovePoster={handleRemovePoster}
      />

      {/* Details */}
      <DetailsSection
        price={form.price}
        price_note={form.price_note}
        dj={form.dj}
        instructors={form.instructors}
        onUpdate={update}
      />

      {/* Registration */}
      <RegistrationSection
        pre_register={form.pre_register}
        registration_link={form.registration_link}
        spots_total={form.spots_total}
        onUpdate={update}
      />

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
});

export type { EventFormValues, EventFormProps } from './types';
