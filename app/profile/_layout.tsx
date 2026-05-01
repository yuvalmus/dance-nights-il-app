import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import BackButton from '@/components/ui/BackButton';

export default function ProfileStackLayout() {
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
        headerRight: () => <BackButton fallbackRoute="/(tabs)/profile" />,
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
  );
}
