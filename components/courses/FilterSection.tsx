import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

type Props = {
  title: string;
  children: React.ReactNode;
};

export function FilterSection({ title, children }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  title: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
  },
});
