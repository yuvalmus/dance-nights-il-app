import { getVenueLogo } from "@/constants/venueLogos";
import { EventWithVenue } from "@/types/database";
import { useState, useCallback } from "react";
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
  const [imageLoaded, setImageLoaded] = useState(false);
  const logo = getVenueLogo(event.venue_slug);
  const themeColor = event.theme_color || "#d4a017";

  const onImageLoad = useCallback(() => {
    if (IS_ANDROID) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setImageLoaded(true);
        });
      });
    } else {
      setImageLoaded(true);
    }
  }, []);

  return (
    <Marker
      coordinate={{
        latitude: event.venue_lat,
        longitude: event.venue_lng,
      }}
      onPress={onPress}
      tracksViewChanges={IS_ANDROID && !imageLoaded}
    >
      {IS_ANDROID ? (
        <EventPinAndroid
          name={event.venue_name}
          logo={logo}
          themeColor={themeColor}
          isSelected={isSelected}
          onImageLoad={onImageLoad}
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