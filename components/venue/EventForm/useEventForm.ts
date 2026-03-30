import { useState, useEffect } from 'react';
import { EventFormValues, ScheduleEntryForm, RegistrationLinkForm, DEFAULT_VALUES } from './types';

export function useEventForm(
  initialValues?: Partial<EventFormValues>,
  onSubmit?: (values: EventFormValues) => Promise<void>,
  onSubmitRef?: React.MutableRefObject<(() => void) | null>,
) {
  const [form, setForm] = useState<EventFormValues>({
    ...DEFAULT_VALUES,
    ...initialValues,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = <K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  // Dance styles
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
  };

  const updateScheduleEntry = (index: number, field: keyof ScheduleEntryForm, value: string) => {
    const updated = [...form.schedules];
    updated[index] = { ...updated[index], [field]: value };
    update('schedules', updated);
  };

  const removeScheduleEntry = (index: number) => {
    update('schedules', form.schedules.filter((_, i) => i !== index));
  };

  // Registration link management
  const addRegistrationLink = () => {
    update('registration_links', [
      ...form.registration_links,
      { label: '', url: '', spots_total: '', spots_taken: '' },
    ]);
  };

  const updateRegistrationLink = (index: number, field: keyof RegistrationLinkForm, value: string) => {
    const updated = [...form.registration_links];
    updated[index] = { ...updated[index], [field]: value };
    update('registration_links', updated);
  };

  const removeRegistrationLink = (index: number) => {
    update('registration_links', form.registration_links.filter((_, i) => i !== index));
  };

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) newErrors.title = 'שדה חובה';
    if (!form.date) newErrors.date = 'שדה חובה';
    if (form.dance_styles.length === 0) newErrors.dance_styles = 'בחר לפחות סגנון אחד';

    form.registration_links.forEach((link, i) => {
      if (!link.label.trim()) newErrors[`link_${i}_label`] = 'שדה חובה';
      if (!link.url.trim()) newErrors[`link_${i}_url`] = 'שדה חובה';
      if (!link.spots_total.trim()) newErrors[`link_${i}_spots_total`] = 'שדה חובה';
      if (!link.spots_taken.trim()) newErrors[`link_${i}_spots_taken`] = 'שדה חובה';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !onSubmit) return;
    const submitValues = { ...form };
    await onSubmit(submitValues);
  };

  useEffect(() => {
    if (onSubmitRef) onSubmitRef.current = handleSubmit;
  });

  return {
    form,
    setForm,
    errors,
    update,
    toggleDanceStyle,
    addScheduleEntry,
    updateScheduleEntry,
    removeScheduleEntry,
    addRegistrationLink,
    updateRegistrationLink,
    removeRegistrationLink,
    handleSubmit,
  };
}
