import { ScrollView, StyleSheet, View } from 'react-native';
import ActionButton from '@/components/ui/ActionButton';
import FormPosterSection from '@/components/ui/FormPosterSection';

import { CourseFormProps } from './types';
import { useCourseForm } from './useCourseForm';
import BasicsSection from './BasicsSection';
import ScheduleSection from './ScheduleSection';
import ContentSection from './ContentSection';
import RegistrationSection from './RegistrationSection';

export default function CourseForm({
  initialValues,
  onSubmit,
  onPickImage,
  submitLabel,
  loading = false,
  onSubmitRef,
}: CourseFormProps) {
  const {
    form,
    setForm,
    errors,
    update,
    addScheduleEntry,
    updateScheduleEntry,
    removeScheduleEntry,
    addListItem,
    updateListItem,
    removeListItem,
    handleSubmit,
  } = useCourseForm(initialValues, onSubmit, onSubmitRef);

  const handlePickImage = async () => {
    const uri = await onPickImage();
    if (uri) {
      setForm((prev) => ({ ...prev, posterUri: uri, posterChanged: true }));
    }
  };

  const handleRemovePoster = () => {
    setForm((prev) => ({ ...prev, posterUri: null, posterChanged: true }));
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <BasicsSection values={form} errors={errors} onUpdate={update} />

      <ScheduleSection
        schedules={form.schedules}
        errors={errors}
        onAdd={addScheduleEntry}
        onUpdate={updateScheduleEntry}
        onRemove={removeScheduleEntry}
      />

      <FormPosterSection
        posterUri={form.posterUri}
        onPickImage={handlePickImage}
        onRemovePoster={handleRemovePoster}
      />

      <ContentSection
        announcements={form.announcements}
        learning_outcomes={form.learning_outcomes}
        onAdd={addListItem}
        onUpdate={updateListItem}
        onRemove={removeListItem}
      />

      <RegistrationSection values={form} onUpdate={update} />

      <ActionButton label={submitLabel} onPress={handleSubmit} loading={loading} />

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
});

export type { CourseFormValues, CourseFormProps } from './types';
