import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

type FormSectionProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function FormSection({ title, subtitle, children }: FormSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 12,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'right',
    marginTop: -8,
    marginBottom: 12,
  },
});
