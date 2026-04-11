import {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { StyleSheet, Platform } from "react-native";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT,
  MapStyleElement,
} from "react-native-maps";
import { EventWithVenue } from "@/types/database";
import { UserLocation } from "@/lib/location";
import { MAP_CONFIG } from "@/constants/config";
import { getVenueLogo } from "@/constants/venueLogos";
import { EventPinIOS } from "./EventPinIOS";
import { EventPinAndroid } from "./EventPinAndroid";
import EventMarker from "./EventMarker";

// Offset the camera so the marker sits in the upper third (above the mid-height bottom sheet)
const LAT_OFFSET = -0.004;
const MIN_DELTA = 0.015;

export type MapRef = {
  centerOn: (lat: number, lng: number) => void;
  fitAll: () => void;
};

type Props = {
  events: EventWithVenue[];
  selectedEventId: string | null;
  onPinPress: (eventId: string) => void;
  onMapPress: () => void;
  onMapPan: () => void;
  userLocation?: UserLocation | null;
};

export const EventMap = forwardRef<MapRef, Props>(
  ({ events, selectedEventId, onPinPress, onMapPress, onMapPan, userLocation }, ref) => {
    const mapRef = useRef<MapView>(null);
    const markerJustPressed = useRef(false);

    const fitAllMarkers = useCallback(() => {
      if (!mapRef.current) return;

      // No events — center on user's location if available, otherwise stay put
      if (events.length === 0) {
        if (userLocation) {
          mapRef.current.animateToRegion(
            {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            },
            400,
          );
        }
        return;
      }

      const lats = events.map((e) => e.venue_lat);
      const lngs = events.map((e) => e.venue_lng);

      if (userLocation) {
        lats.push(userLocation.latitude);
        lngs.push(userLocation.longitude);
      }

      const latSpan = Math.max(
        Math.max(...lats) - Math.min(...lats),
        MIN_DELTA,
      );
      const lngSpan = Math.max(
        Math.max(...lngs) - Math.min(...lngs),
        MIN_DELTA,
      );

      mapRef.current.animateToRegion(
        {
          latitude: (Math.min(...lats) + Math.max(...lats)) / 2 + LAT_OFFSET,
          longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
          latitudeDelta: latSpan * 1.8,
          longitudeDelta: lngSpan * 1.8,
        },
        400,
      );
    }, [events, userLocation]);

    useImperativeHandle(
      ref,
      () => ({
        centerOn(lat: number, lng: number) {
          mapRef.current?.animateToRegion(
            {
              latitude: lat + LAT_OFFSET,
              longitude: lng,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            },
            400,
          );
        },
        fitAll: fitAllMarkers,
      }),
      [fitAllMarkers],
    );

    useEffect(() => {
      fitAllMarkers();
    }, [fitAllMarkers]);

    return (
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={
          Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
        }
        initialRegion={userLocation ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        } : MAP_CONFIG.initialRegion}
        showsUserLocation
        showsCompass={false}
        showsMyLocationButton={false}
        onPress={() => {
          if (markerJustPressed.current) {
            markerJustPressed.current = false;
            return;
          }
          onMapPress();
        }}
        onPanDrag={onMapPan}
        {...(Platform.OS === "android"
          ? { customMapStyle: darkMapStyle }
          : { userInterfaceStyle: "dark" })}
      >
        {events.map((event) => {
          const isSelected = selectedEventId === event.event_id;
          return (
            <EventMarker
              key={`${event.event_id}-${isSelected}`}
              event={event}
              isSelected={isSelected}
              onPress={() => {
                markerJustPressed.current = true;
                onPinPress(event.event_id);
              }}
            />
          );
        })}
      </MapView>
    );
  },
);

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

const darkMapStyle: MapStyleElement[] = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2c2c2c" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a8a8a" }],
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#000000" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3d3d3dff" }],
  },
];
