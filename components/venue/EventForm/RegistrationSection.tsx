import FormSection from '@/components/ui/FormSection';
import FormToggle from '@/components/ui/FormToggle';
import FormInput from '@/components/ui/FormInput';
import { EventFormValues } from './types';

type Props = {
  pre_register: boolean;
  registration_link: string;
  spots_total: string;
  onUpdate: <K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) => void;
};

export default function RegistrationSection({ pre_register, registration_link, spots_total, onUpdate }: Props) {
  return (
    <FormSection title="הרשמה">
      <FormToggle
        label="הרשמה מראש"
        description="נדרשת הרשמה לפני האירוע"
        value={pre_register}
        onValueChange={(v) => onUpdate('pre_register', v)}
      />
      {pre_register && (
        <FormInput
          label="מקישור הרשה"
          value={registration_link}
          onChangeText={(v) => onUpdate('registration_link', v)}
          placeholder="https://..."
          autoCapitalize="none"
          keyboardType="url"
          style={{ textAlign: 'left' }}
        />
      )}
      <FormInput
        label="מספר מקומות"
        value={spots_total}
        onChangeText={(v) => onUpdate('spots_total', v)}
        placeholder="השאר ריק אם ללא הגבלה"
        keyboardType="number-pad"
      />
    </FormSection>
  );
}
