import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import FormToggle from '@/components/ui/FormToggle';
import FormInput from '@/components/ui/FormInput';
import { EventFormValues, RegistrationLinkForm } from './types';

type Props = {
  price: string;
  price_note: string;
  pre_register: boolean;
  registration_links: RegistrationLinkForm[];
  errors: Record<string, string>;
  onUpdate: <K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) => void;
  onTogglePreRegister: (value: boolean) => void;
  onAddLink: () => void;
  onUpdateLink: (index: number, field: keyof RegistrationLinkForm, value: string) => void;
  onRemoveLink: (index: number) => void;
};

export default function RegistrationSection({
  price,
  price_note,
  pre_register,
  registration_links,
  errors,
  onUpdate,
  onTogglePreRegister,
  onAddLink,
  onUpdateLink,
  onRemoveLink,
}: Props) {
  const [expanded, setExpanded] = useState(registration_links.length > 0);
  const linkCount = registration_links.length;
  const linksDisabled = !pre_register;
  const priceDisabled = pre_register && linkCount > 1;

  const handleAdd = () => {
    if (linksDisabled) return;
    onAddLink();
    setExpanded(true);
  };

  return (
    <View style={styles.sectionContainer}>
      <TouchableOpacity
        style={styles.collapsibleHeader}
        onPress={() => setExpanded(!expanded)}
      >
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-back'}
          size={20}
          color={Colors.textMuted}
        />
        <View style={styles.collapsibleTitleRow}>
          <Text style={styles.sectionTitle}>
            הרשמה{linkCount > 0 && !expanded ? ` (${linkCount})` : ''}
          </Text>
          {expanded && (
            <Text style={styles.sectionSubtitle}>הוסף קישורי הרשמה לאירוע</Text>
          )}
        </View>
      </TouchableOpacity>

      {expanded && (
        <>
          <Text style={styles.fieldLabel}>מחיר</Text>
          <View style={[styles.priceRow, priceDisabled && styles.disabledField]}>
            <Text style={[styles.shekelPrefix, priceDisabled && styles.disabledText]}>₪</Text>
            <TextInput
              value={price}
              onChangeText={(v) => onUpdate('price', v.replace(/[^0-9]/g, ''))}
              placeholder="מחיר הכרטיס"
              placeholderTextColor={Colors.textMuted}
              selectionColor={Colors.primary}
              keyboardType="number-pad"
              style={[styles.priceTextInput, priceDisabled && styles.disabledText]}
              editable={!priceDisabled}
            />
          </View>

          <View style={priceDisabled ? styles.disabledField : undefined}>
            <FormInput
              label="הערת מחיר"
              value={price_note}
              onChangeText={(v) => onUpdate('price_note', v)}
              placeholder="הנחה לסטודנטים"
              editable={!priceDisabled}
            />
          </View>

          {priceDisabled && (
            <Text style={styles.priceHint}>
              לא ניתן להגדיר מחיר כולל כשיש יותר מקישור הרשמה אחד
            </Text>
          )}

          <FormToggle
            label="הרשמה מראש"
            description="נדרשת הרשמה לפני האירוע"
            value={pre_register}
            onValueChange={onTogglePreRegister}
          />

          <View style={linksDisabled ? styles.disabledField : undefined} pointerEvents={linksDisabled ? 'none' : 'auto'}>
            {registration_links.map((link, index) => (
              <View key={index} style={styles.linkRow}>
                <TouchableOpacity
                  onPress={() => onRemoveLink(index)}
                  style={styles.removeBtn}
                >
                  <Ionicons name="close-circle" size={20} color={Colors.error} />
                </TouchableOpacity>
                <View style={styles.linkFields}>
                  <FormInput
                    label="שם הקישור"
                    value={link.label}
                    onChangeText={(v) => onUpdateLink(index, 'label', v)}
                    placeholder="שם קישור"
                    error={errors[`link_${index}_label`]}
                  />
                  <FormInput
                    label="קישור הרשמה"
                    value={link.url}
                    onChangeText={(v) => onUpdateLink(index, 'url', v)}
                    placeholder="https://..."
                    autoCapitalize="none"
                    keyboardType="url"
                    style={{ textAlign: 'left' }}
                    error={errors[`link_${index}_url`]}
                  />
                  <View style={styles.spotsRow}>
                    <View style={styles.spotsField}>
                      <FormInput
                        label="סה״כ מקומות"
                        value={link.spots_total}
                        onChangeText={(v) => onUpdateLink(index, 'spots_total', v)}
                        placeholder="50"
                        keyboardType="number-pad"
                        error={errors[`link_${index}_spots_total`]}
                      />
                    </View>
                    <View style={styles.spotsField}>
                      <FormInput
                        label="מקומות תפוסים"
                        value={link.spots_taken}
                        onChangeText={(v) => onUpdateLink(index, 'spots_taken', v)}
                        placeholder="0"
                        keyboardType="number-pad"
                        error={errors[`link_${index}_spots_taken`]}
                      />
                    </View>
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.addRow, linksDisabled && styles.addRowDisabled]}
              onPress={handleAdd}
              disabled={linksDisabled}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={linksDisabled ? Colors.textMuted : Colors.primary}
              />
              <Text style={[styles.addRowText, linksDisabled && styles.addRowTextDisabled]}>
                הוסף קישור
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 24,
  },
  collapsibleHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  collapsibleTitleRow: {
    flex: 1,
    alignItems: 'flex-end',
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'right',
  },
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
  priceHint: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 12,
  },
  sectionSubtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'right',
    marginTop: 2,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surfaceLight || Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  linkFields: {
    flex: 1,
  },
  removeBtn: {
    padding: 4,
    marginTop: 4,
  },
  spotsRow: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  spotsField: {
    flex: 1,
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
  addRowDisabled: {
    opacity: 0.4,
  },
  addRowText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  addRowTextDisabled: {
    color: Colors.textMuted,
  },
  disabledField: {
    opacity: 0.4,
  },
  disabledText: {
    color: Colors.textMuted,
  },
});
