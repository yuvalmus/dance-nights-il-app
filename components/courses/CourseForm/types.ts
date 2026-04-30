import { CourseType, DanceLevel } from '@/constants/config';
import { VenueCandidate } from '@/hooks/useVenueSearch';

export type CourseScheduleForm = {
  date: string;        // YYYY-MM-DD
  start_time: string;  // HH:mm
  end_time: string;    // HH:mm
  description: string;
};

export type CourseFormValues = {
  title: string;
  description: string;
  type: CourseType;
  dance_style: string;
  level: DanceLevel | '';
  /** Display name — free-text or synced with a linked profile. */
  instructor: string;
  /** UUID when linked to an existing user; null for free-text instructors. */
  instructor_id: string | null;
  /** Full venue candidate so we can render logo/name without a round-trip. */
  venue: VenueCandidate | null;
  price: string;
  spots_total: string;
  registration_url: string;
  is_published: boolean;
  announcements: string[];
  learning_outcomes: string[];
  posterUri: string | null;
  posterChanged: boolean;
  schedules: CourseScheduleForm[];
};

export const DEFAULT_COURSE_VALUES: CourseFormValues = {
  title: '',
  description: '',
  type: 'course',
  dance_style: '',
  level: '',
  instructor: '',
  instructor_id: null,
  venue: null,
  price: '',
  spots_total: '',
  registration_url: '',
  is_published: true,
  announcements: [],
  learning_outcomes: [],
  posterUri: null,
  posterChanged: false,
  schedules: [],
};

export type CourseFormProps = {
  initialValues?: Partial<CourseFormValues>;
  onSubmit: (values: CourseFormValues) => Promise<void>;
  onPickImage: () => Promise<string | null>;
  submitLabel: string;
  loading?: boolean;
  onSubmitRef?: React.MutableRefObject<(() => void) | null>;
};
