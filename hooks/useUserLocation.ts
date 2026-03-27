import { useState, useEffect } from 'react';
import { getUserLocation, UserLocation } from '@/lib/location';

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);

  useEffect(() => {
    getUserLocation().then(setLocation);
  }, []);

  return location;
}
