import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/lib/auth";
import { Colors } from "@/constants/colors";
import { useAppReady } from "@/hooks/useAppReady";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { NavigationSheet, navigationSheetRef } from "@/components/ui/NavigationSheet";

// Inner component runs inside <AuthProvider> so it can read auth state.
function PushBoot() {
  usePushNotifications();
  return null;
}

export default function RootLayout() {
  const ready = useAppReady();

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <PushBoot />
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="(auth)"
            options={{
              presentation: "modal",
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="venue"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="course"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="activity"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="profile"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="notifications"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
        <NavigationSheet ref={navigationSheetRef} />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
