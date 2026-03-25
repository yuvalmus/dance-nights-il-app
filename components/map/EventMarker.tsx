import { getVenueLogo } from "@/constants/venueLogos";
import { EventWithVenue } from "@/types/database";
import { useState, useCallback, useEffect } from "react";
import { Platform } from "react-native";
import { EventPinAndroid } from "./EventPinAndroid";
import { EventPinIOS } from "./EventPinIOS";
import { Marker } from "react-native-maps";

const IS_ANDROID = Platform.OS === "android";

function EventMarker({
  event,
  isSelected,
  onPress,
}: {
  event: EventWithVenue;
  isSelected: boolean;
  onPress: () => void;
}) {
  const [bitmapReady, setBitmapReady] = useState(!IS_ANDROID);
  const logo = getVenueLogo(event.venue_slug);
  const themeColor = event.theme_color || "#d4a017";

  // On Android, keep tracksViewChanges on for 500ms to let the bitmap
  // capture the fully rendered view (circle + image), then freeze it.
  useEffect(() => {
    if (!IS_ANDROID) return;
    const timer = setTimeout(() => setBitmapReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Marker
      coordinate={{
        latitude: event.venue_lat,
        longitude: event.venue_lng,
      }}
      onPress={onPress}
      tracksViewChanges={!bitmapReady}
    >
      {IS_ANDROID ? (
        <EventPinAndroid
          name={event.venue_name}
          logo={logo}
          themeColor={themeColor}
          isSelected={isSelected}
        />
      ) : (
        <EventPinIOS
          name={event.venue_name}
          logo={logo}
          themeColor={themeColor}
          isSelected={isSelected}
        />
      )}
    </Marker>
  );
}

export default EventMarker;
