import { createRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { useState, useImperativeHandle, forwardRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import type { NavApp } from '@/lib/navigation';

export type NavigationSheetHandle = {
  show: (apps: NavApp[]) => void;
};

export const navigationSheetRef = createRef<NavigationSheetHandle>();

export const NavigationSheet = forwardRef<NavigationSheetHandle>((_props, ref) => {
  const [visible, setVisible] = useState(false);
  const [apps, setApps] = useState<NavApp[]>([]);
  const insets = useSafeAreaInsets();

  useImperativeHandle(ref ?? navigationSheetRef, () => ({
    show(navApps: NavApp[]) {
      setApps(navApps);
      setVisible(true);
    },
  }));

  const handleSelect = (app: NavApp) => {
    setVisible(false);
    Linking.openURL(app.url).catch(() => {
      Alert.alert('', `${app.name} לא מותקן במכשיר`);
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <TouchableWithoutFeedback onPress={() => setVisible(false)}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
              <Text style={styles.title}>נווט עם</Text>

              {apps.map((app) => (
                <TouchableOpacity key={app.name} style={styles.option} onPress={() => handleSelect(app)}>
                  <Text style={styles.optionText}>{app.name}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.cancel} onPress={() => setVisible(false)}>
                <Text style={styles.cancelText}>ביטול</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  title: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  option: {
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  optionText: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '500',
  },
  cancel: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
  },
  cancelText: {
    color: Colors.primary,
    fontSize: 17,
    fontWeight: '600',
  },
});
