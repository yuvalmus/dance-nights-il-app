import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import FormSection from '@/components/ui/FormSection';
import FormInput from '@/components/ui/FormInput';
import PillSelect from '@/components/ui/PillSelect';
import VenueSearchBox from '@/components/venue/VenueSearchBox';
import InstructorSearchBox from './InstructorSearchBox';
import {
  COURSE_TYPES,
  COURSE_TYPE_LABELS,
  DANCE_STYLES,
  DANCE_STYLE_LABELS,
  DANCE_LEVELS,
  DANCE_LEVEL_LABELS,
  CourseType,
  DanceLevel,
} from '@/constants/config';
import { CourseFormValues } from './types';
import { VenueCandidate } from '@/hooks/useVenueSearch';

type Props = {
  values: CourseFormValues;
  errors: Record<string, string>;
  onUpdate: <K extends keyof CourseFormValues>(
    key: K,
    value: CourseFormValues[K],
  ) => void;
};

export default function BasicsSection({ values, errors, onUpdate }: Props) {
  return (
    <FormSection title="פרטי קורס">
      <FormInput
        label="כותרת"
        value={values.title}
        onChangeText={(t) => onUpdate('title', t)}
        placeholder="שם הקורס"
        error={errors.title}
      />

      <FormInput
        label="תיאור"
        value={values.description}
        onChangeText={(t) => onUpdate('description', t)}
        placeholder="תיאור של הקורס"
        multiline
        numberOfLines={3}
        style={{ minHeight: 80, textAlignVertical: 'top' }}
      />

      <Text style={styles.fieldLabel}>סוג</Text>
      <PillSelect
        items={COURSE_TYPES.map((t) => ({
          value: t,
          label: COURSE_TYPE_LABELS[t],
        }))}
        selected={[values.type]}
        onToggle={(v) => v && onUpdate('type', v as CourseType)}
        mode="single"
        allowEmpty={false}
      />
      {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}

      <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>סגנון ריקוד</Text>
      <PillSelect
        items={DANCE_STYLES.map((s) => ({
          value: s,
          label: DANCE_STYLE_LABELS[s],
        }))}
        selected={values.dance_style ? [values.dance_style] : []}
        onToggle={(v) => onUpdate('dance_style', v)}
        mode="single"
      />

      <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>רמה</Text>
      <PillSelect
        items={[
          { value: 'open', label: 'כל הרמות' },
          ...DANCE_LEVELS.map((l) => ({
            value: l,
            label: DANCE_LEVEL_LABELS[l],
          })),
        ]}
        selected={values.level ? [values.level] : []}
        onToggle={(v) => onUpdate('level', v as DanceLevel | '')}
        mode="single"
      />

      <Text style={[styles.fieldLabel, styles.fieldLabelSpaced, styles.fieldLabelTight]}>
        מועדון מארח
      </Text>
      <Text style={styles.hint}>
        {`השאר ריק אם הקורס לא מתקיים תחת מועדון קבוע.\nבעלי המועדון יצטרך לאשר את הקורס לפני שיפורסם לקהל.`}
      </Text>
      <View style={styles.venueWrap}>
        <VenueSearchBox
          value={values.venue}
          onSelect={(venue: VenueCandidate | null) => onUpdate('venue', venue)}
        />
      </View>

      <InstructorSearchBox
        name={values.instructor}
        instructorId={values.instructor_id}
        onChange={(name, instructorId) => {
          onUpdate('instructor', name);
          onUpdate('instructor_id', instructorId);
        }}
      />
    </FormSection>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 8,
  },
  fieldLabelSpaced: {
    marginTop: 16,
  },
  // Tightens the gap between a label and its immediate subtitle/hint so the
  // two read as one block rather than two disconnected lines.
  fieldLabelTight: {
    marginBottom: 2,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  hint: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 10,
  },
  // Matches FormInput's bottom rhythm (16px) so the venue picker sits evenly
  // between its hint above and the instructor field below.
  venueWrap: {
    marginBottom: 16,
  },
});
