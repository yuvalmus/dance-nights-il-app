import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Bailando",
  slug: "bailando-app",
  version: "0.0.1",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  scheme: "bailando",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#1a1a2e",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    icon: {
      light: "./assets/icon.png",
      dark: "./assets/icon.png",
      tinted: "./assets/monochrome-icon.png",
    },
    supportsTablet: false,
    bundleIdentifier: "com.bailando.app",
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "Bailando uses your location to show nearby dance events and calculate distances.",
      LSApplicationQueriesSchemes: ["waze", "comgooglemaps"],
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-foreground.png",
      monochromeImage: "./assets/monochrome-icon.png",
      backgroundColor: "#1a1a2e",
    },
    package: "com.bailando.app",
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
      },
    },
    permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"],
  },
  plugins: [
    "expo-router",
    "expo-location",
    "expo-secure-store",
    "expo-web-browser",
    "@react-native-community/datetimepicker",
    [
      "expo-image-picker",
      {
        photosPermission:
          "Bailando needs access to your photos to upload event posters.",
      },
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#d4a017",
      },
    ],
    [
      'expo-calendar',
      {
        calendarPermission: 'Bailando צריכה גישה ללוח השנה כדי להוסיף שיעורים.',
      },
    ],
    "expo-asset",
    [
      "expo-font",
      {
        fonts: [
          "node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf",
          "node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf",
        ],
      },
    ],
  ],
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    router: {
      origin: false,
    },
    eas: {
      projectId: "f1617573-0faa-443e-8003-a3232d4c4b48",
    },
  },
  owner: "yuvalmus",
});
