import { useEffect, useState } from "react";
import { I18nManager } from "react-native";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";

// Force LTR at the system level. The app manually implements RTL layout
// (row-reverse, textAlign: 'right') so it looks correct regardless of device language.
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

// Fonts the app needs at runtime (used by components/ui/Icon.tsx).
// In custom dev builds these are embedded natively via the expo-font
// config plugin in app.json, so loading is skipped.  In Expo Go the
// plugin never ran, so we load them here instead.
const REQUIRED_FONTS: Record<string, ReturnType<typeof require>> = {
  Ionicons: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf"),
  MaterialCommunityIcons: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf"),
};

SplashScreen.preventAutoHideAsync();

/**
 * Ensures all runtime prerequisites (fonts, etc.) are ready before the
 * app renders.  Returns `true` once everything is loaded.
 */
export function useAppReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      // Only load fonts that aren't already available (e.g. natively embedded).
      const missing: Record<string, ReturnType<typeof require>> = {};
      for (const [name, asset] of Object.entries(REQUIRED_FONTS)) {
        if (!Font.isLoaded(name)) {
          missing[name] = asset;
        }
      }

      if (Object.keys(missing).length > 0) {
        await Font.loadAsync(missing);
      }

      setReady(true);
      await SplashScreen.hideAsync();
    })();
  }, []);

  return ready;
}
