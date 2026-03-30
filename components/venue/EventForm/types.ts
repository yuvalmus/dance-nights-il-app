export type ScheduleEntryForm = {
  time: string;
  description: string;
  level: string;
};

export type RegistrationLinkForm = {
  label: string;
  url: string;
  spots_total: string;
  spots_taken: string;
};

export type EventFormValues = {
  title: string;
  date: string;
  dance_styles: string[];
  schedules: ScheduleEntryForm[];
  posterUri: string | null;
  posterChanged: boolean;
  price: string;
  price_note: string;
  dj: string;
  instructors: string[];
  pre_register: boolean;
  registration_links: RegistrationLinkForm[];
  is_published: boolean;
  description: string;
};

export const DEFAULT_VALUES: EventFormValues = {
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
  registration_links: [],
  is_published: true,
  description: '',
};

export type EventFormProps = {
  initialValues?: Partial<EventFormValues>;
  onSubmit: (values: EventFormValues) => Promise<void>;
  onPickImage: () => Promise<string | null>;
  submitLabel: string;
  loading?: boolean;
  onSubmitRef?: React.MutableRefObject<(() => void) | null>;
};
