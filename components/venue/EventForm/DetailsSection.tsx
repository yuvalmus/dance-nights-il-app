import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import FormSection from '@/components/ui/FormSection';
import FormInput from '@/components/ui/FormInput';
import { EventFormValues } from './types';

type Props = {
  price: string;
  price_note: string;
  dj: string;
  instructors: string[];
  onUpdate: <K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) => void;
};

export default function DetailsSection({ price, price_note, dj, instructors, onUpdate }: Props) {
  const [newInstructor, setNewInstructor] = useState('');

  const addInstructor = () => {
    const name = newInstructor.trim();
    if (name && !instructors.includes(name)) {
      onUpdate('instructors', [...instructors, name]);
      setNewInstructor('');
    }
  };

  const removeInstructor = (name: string) => {
    onUpdate('instructors', instructors.filter((i) => i !== name));
  };

  return (
    <FormSection title="פרטים נוספים">
      <Text style={styles.fieldLabel}>מחיר</Text>
      <View style={styles.priceRow}>
        <Text style={styles.shekelPrefix}>₪</Text>
        <TextInput
          value={price}
          onChangeText={(v) => onUpdate('price', v.replace(/[^0-9]/g, ''))}
          placeholder="50"
          placeholderTextColor={Colors.textMuted}
          selectionColor={Colors.primary}
          keyboardType="number-pad"
          style={styles.priceTextInput}
        />
      </View>

      <FormInput
        label="הערת מחיר"
        value={price_note}
        onChangeText={(v) => onUpdate('price_note', v)}
        placeholder="הנחה לסטודנטים"
      />
      <FormInput
        label="DJ"
        value={dj}
        onChangeText={(v) => onUpdate('dj', v)}
        placeholder="שם ה-DJ"
      />

      <Text style={styles.fieldLabel}>מדריכים</Text>
      <View style={styles.instructorTags}>
        {instructors.map((name) => (
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
