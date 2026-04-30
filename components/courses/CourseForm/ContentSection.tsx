import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import FormSection from '@/components/ui/FormSection';

type ListKey = 'announcements' | 'learning_outcomes';

type Props = {
  announcements: string[];
  learning_outcomes: string[];
  onAdd: (key: ListKey) => void;
  onUpdate: (key: ListKey, index: number, value: string) => void;
  onRemove: (key: ListKey, index: number) => void;
};

/**
 * Two free-form string lists shown in course details — announcements get
 * the golden highlight card, learning outcomes become the "what will we
 * learn" checklist. Same editing affordance for both.
 */
export default function ContentSection({
  announcements,
  learning_outcomes,
  onAdd,
  onUpdate,
  onRemove,
}: Props) {
  return (
    <>
      <FormSection title="מה נלמד בקורס?" subtitle="רשימת צ'קליסט שתוצג לרקדנים">
        <StringList
          values={learning_outcomes}
          placeholder="לדוגמה: בסיסי בצ'אטה"
          onAdd={() => onAdd('learning_outcomes')}
          onUpdate={(i, v) => onUpdate('learning_outcomes', i, v)}
          onRemove={(i) => onRemove('learning_outcomes', i)}
          addLabel="הוסף נקודה"
        />
      </FormSection>

      <FormSection title="הודעות חשובות" subtitle="יוצגו בכרטיסים זהובים בולטים">
        <StringList
          values={announcements}
          placeholder="לדוגמה: מינימום 20 משתתפים"
          onAdd={() => onAdd('announcements')}
          onUpdate={(i, v) => onUpdate('announcements', i, v)}
          onRemove={(i) => onRemove('announcements', i)}
          addLabel="הוסף הודעה"
        />
      </FormSection>
    </>
  );
}

function StringList({
  values,
  placeholder,
  onAdd,
  onUpdate,
  onRemove,
  addLabel,
}: {
  values: string[];
  placeholder: string;
  onAdd: () => void;
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  addLabel: string;
}) {
  return (
    <View>
      {values.map((value, index) => (
        <View key={index} style={styles.itemRow}>
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => onRemove(index)}
          >
            <Ionicons name="close-circle" size={20} color={Colors.error} />
          </TouchableOpacity>
          <TextInput
            style={styles.itemInput}
            value={value}
            onChangeText={(t) => onUpdate(index, t)}
            placeholder={placeholder}
            placeholderTextColor={Colors.textMuted}
            selectionColor={Colors.primary}
            multiline
          />
        </View>
      ))}
      <TouchableOpacity style={styles.addRow} onPress={onAdd}>
        <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
        <Text style={styles.addRowText}>{addLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  removeBtn: {
    padding: 4,
    marginTop: 12,
  },
  itemInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontSize: 14,
    textAlign: 'right',
    minHeight: 44,
  },
  addRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  addRowText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
