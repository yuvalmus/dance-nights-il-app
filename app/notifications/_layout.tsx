import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';

export default function NotificationsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerTitleStyle: { color: Colors.text, fontWeight: '700' },
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
  );
}
