import { useState, useEffect } from 'react';
import {
  CourseFormValues,
  CourseScheduleForm,
  DEFAULT_COURSE_VALUES,
} from './types';

export function useCourseForm(
  initialValues?: Partial<CourseFormValues>,
  onSubmit?: (values: CourseFormValues) => Promise<void>,
  onSubmitRef?: React.MutableRefObject<(() => void) | null>,
) {
  const [form, setForm] = useState<CourseFormValues>({
    ...DEFAULT_COURSE_VALUES,
    ...initialValues,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = <K extends keyof CourseFormValues>(
    key: K,
    value: CourseFormValues[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  // Schedule management
  const addScheduleEntry = () => {
    update('schedules', [
      ...form.schedules,
      {
        date: new Date().toISOString().split('T')[0],
        start_time: '',
        end_time: '',
        description: '',
      },
    ]);
  };

  const updateScheduleEntry = (
    index: number,
    field: keyof CourseScheduleForm,
    value: string,
  ) => {
    const updated = [...form.schedules];
    updated[index] = { ...updated[index], [field]: value };
    update('schedules', updated);
  };

  const removeScheduleEntry = (index: number) => {
    update(
      'schedules',
      form.schedules.filter((_, i) => i !== index),
    );
  };

  // String-list management (announcements + learning outcomes share shape)
  const addListItem = (key: 'announcements' | 'learning_outcomes') => {
    update(key, [...form[key], '']);
  };

  const updateListItem = (
    key: 'announcements' | 'learning_outcomes',
    index: number,
    value: string,
  ) => {
    const updated = [...form[key]];
    updated[index] = value;
    update(key, updated);
  };

  const removeListItem = (
    key: 'announcements' | 'learning_outcomes',
    index: number,
  ) => {
    update(
      key,
      form[key].filter((_, i) => i !== index),
    );
  };

  // Validation — keep surface small; DB rejects malformed rows regardless.
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) newErrors.title = 'שדה חובה';
    if (!form.type) newErrors.type = 'שדה חובה';

    form.schedules.forEach((s, i) => {
      if (!s.date) newErrors[`schedule_${i}_date`] = 'שדה חובה';
      if (!s.start_time) newErrors[`schedule_${i}_start_time`] = 'שדה חובה';
      if (!s.end_time) newErrors[`schedule_${i}_end_time`] = 'שדה חובה';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !onSubmit) return;
    // Drop empty list rows so we don't persist placeholders.
    const cleaned: CourseFormValues = {
      ...form,
      announcements: form.announcements.map((s) => s.trim()).filter(Boolean),
      learning_outcomes: form.learning_outcomes.map((s) => s.trim()).filter(Boolean),
    };
    await onSubmit(cleaned);
  };

  useEffect(() => {
    if (onSubmitRef) onSubmitRef.current = handleSubmit;
  });

  return {
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
  };
}
