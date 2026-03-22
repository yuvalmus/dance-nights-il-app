import { useRef, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT, MapStyleElement } from 'react-native-maps';
import { EventWithVenue } from '@/types/database';
import { MAP_CONFIG } from '@/constants/config';
import { EventPin } from './EventPin';

type Props = {
  events: EventWithVenue[];
  selectedEventId: string | null;
  onPinPress: (eventId: string) => void;
};

export function EventMap({ events, selectedEventId, onPinPress }: Props) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (events.length > 0 && mapRef.current) {
      const coords = events.map((e) => ({
        latitude: e.venue_lat,
        longitude: e.venue_lng,
      }));
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 120, right: 60, bottom: 300, left: 60 },
        animated: true,
      });
    }
  }, [events]);

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
      initialRegion={MAP_CONFIG.initialRegion}
      showsUserLocation
      showsCompass={false}
      showsMyLocationButton={false}
      {...(Platform.OS === 'android' ? { customMapStyle: darkMapStyle } : { userInterfaceStyle: 'dark' })}
    >
      {events.map((event) => (
        <Marker
          key={event.event_id}
          coordinate={{
            latitude: event.venue_lat,
            longitude: event.venue_lng,
          }}
          onPress={() => onPinPress(event.event_id)}
        >
          <EventPin
            name={event.venue_name}
            isSelected={selectedEventId === event.event_id}
          />
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

// Dark theme for Google Maps
const darkMapStyle: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#212121' }] },
  { featureType: 'poi', stylers: [{ visibility: "off" }] },
  { featureType: 'poi.business', stylers: [{ visibility: "off" }] },
  { featureType: 'transit', stylers: [{ visibility: "off" }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: "off" }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3dff' }] },
];
