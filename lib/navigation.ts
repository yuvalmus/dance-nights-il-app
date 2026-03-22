import { Linking, Platform } from 'react-native';
import { navigationSheetRef } from '@/components/ui/NavigationSheet';

type NavApp = { name: string; url: string };

function getApps(lat: number, lng: number, label: string): NavApp[] {
  if (Platform.OS === 'android') {
    return [{ name: 'ניווט', url: `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label)})` }];
  }

  return [
    { name: 'Waze', url: `waze://?ll=${lat},${lng}&navigate=yes` },
    { name: 'Google Maps', url: `comgooglemaps://?daddr=${lat},${lng}` },
    { name: 'Apple Maps', url: `maps:?daddr=${lat},${lng}&q=${encodeURIComponent(label)}` },
  ];
}

export function openNavigation(lat: number, lng: number, label: string) {
  const apps = getApps(lat, lng, label);

  if (Platform.OS === 'android') {
    Linking.openURL(apps[0].url);
    return;
  }

  navigationSheetRef.current?.show(apps);
}

export type { NavApp };
