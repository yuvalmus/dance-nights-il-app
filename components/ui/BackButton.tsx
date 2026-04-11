import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';

type Props = {
  fallbackRoute?: string;
};

export default function BackButton({ fallbackRoute }: Props) {
  const router = useRouter();

  const handlePress = () => {
    if (fallbackRoute && !router.canGoBack()) {
      router.replace(fallbackRoute as any);
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.button}
      hitSlop={8}
    >
      <Text style={styles.text}>חזרה</Text>
      <Ionicons name="chevron-forward" size={22} color={Colors.text} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
  },
  text: {
    color: Colors.text,
    fontSize: 15,
  },
});
