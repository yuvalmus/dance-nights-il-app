import * as Location from 'expo-location';

export type UserLocation = {
  latitude: number;
  longitude: number;
};

// Default: Tel Aviv center
const DEFAULT_LOCATION: UserLocation = {
  latitude: 32.0853,
  longitude: 34.7818,
};

export async function getUserLocation(): Promise<UserLocation> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return DEFAULT_LOCATION;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch {
    return DEFAULT_LOCATION;
  }
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} מ'`;
  }
  return `${(meters / 1000).toFixed(1)} ק"מ`;
}

export { DEFAULT_LOCATION };
