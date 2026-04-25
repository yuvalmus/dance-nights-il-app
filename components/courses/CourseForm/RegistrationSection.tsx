import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import FormSection from '@/components/ui/FormSection';
import FormInput from '@/components/ui/FormInput';
import FormToggle from '@/components/ui/FormToggle';
import { CourseFormValues } from './types';

type Props = {
  values: CourseFormValues;
  onUpdate: <K extends keyof CourseFormValues>(
    key: K,
    value: CourseFormValues[K],
  ) => void;
};

export default function RegistrationSection({ values, onUpdate }: Props) {
  return (
    <>
      <FormSection title="הרשמה ומחיר">
        <Text style={styles.fieldLabel}>מחיר</Text>
        <View style={styles.priceRow}>
          <Text style={styles.shekelPrefix}>₪</Text>
          <TextInput
            value={values.price}
            onChangeText={(v) => onUpdate('price', v.replace(/[^0-9]/g, ''))}
            placeholder="מחיר הקורס"
            placeholderTextColor={Colors.textMuted}
            selectionColor={Colors.primary}
            keyboardType="number-pad"
            style={styles.priceTextInput}
          />
        </View>

        <FormInput
          label="מספר מקומות"
          value={values.spots_total}
          onChangeText={(v) => onUpdate('spots_total', v.replace(/[^0-9]/g, ''))}
          placeholder="למשל 30"
          keyboardType="number-pad"
        />

        <FormInput
          label="קישור להרשמה"
          value={values.registration_url}
          onChangeText={(v) => onUpdate('registration_url', v)}
          placeholder="https://..."
          autoCapitalize="none"
          keyboardType="url"
          style={{ textAlign: 'left' }}
        />
      </FormSection>

      <FormSection title="פרסום">
        <FormToggle
          label="פרסום הקורס"
          description="הקורס יופיע ברשימת הקורסים לכל המשתמשים"
          value={values.is_published}
          onValueChange={(v) => onUpdate('is_published', v)}
        />
      </FormSection>
    </>
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
});
