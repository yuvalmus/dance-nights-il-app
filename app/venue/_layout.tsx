import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';

export default function VenueLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '600' },
        headerTitleAlign: 'center',
        headerBackVisible: false,
        headerLeft: () => null,
        headerRight: () => (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={8}
          >
            <Text style={styles.backText}>חזרה</Text>
            <Ionicons name="chevron-forward" size={22} color={Colors.text} />
          </TouchableOpacity>
        ),
        headerRightContainerStyle: { flexGrow: 0 },
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
  );
}

const styles = StyleSheet.create({
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
  },
  backText: {
    color: Colors.text,
    fontSize: 15,
  },
});
