import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Noche",
  slug: "noche-app",
  version: "0.0.1",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  scheme: "noche",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#1a1a2e",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.noche.app",
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "Noche uses your location to show nearby dance events and calculate distances.",
      LSApplicationQueriesSchemes: ["waze", "comgooglemaps"],
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#1a1a2e",
    },
    package: "com.noche.app",
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
      },
    },
    permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"],
  },
  plugins: [
    "expo-router",
    "expo-location",
    "expo-secure-store",
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#d4a017",
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
    router: {
      origin: false,
    },
    eas: {
      projectId: "5e989128-1c89-46bd-9643-c4bdad1c9bdf",
    },
  },
  owner: "yuvalmus",
});
