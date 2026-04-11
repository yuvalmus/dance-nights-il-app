import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@/components/ui/Icon";
import { useNavigation } from "expo-router";
import { Colors } from "@/constants/colors";
import { useEvents } from "@/hooks/useEvents";
import { filterEvents } from "@/lib/eventFilters";
import { useUserLocation } from "@/hooks/useUserLocation";
import { EventMap, MapRef } from "@/components/map/EventMap";
import { DateToggle } from "@/components/map/DateToggle";
import { EventBottomSheet, SheetRef } from "@/components/events/EventBottomSheet";
import { FilterPills } from "@/components/events/FilterPills";
import { PollButton } from "@/components/poll/PollButton";
import { getTodayKey, isInBoundaryWindow, getLastNightKey } from "@/lib/date";

const BOUNDARY = isInBoundaryWindow();
const INITIAL_DATE = BOUNDARY ? getLastNightKey() : getTodayKey();

export default function TonightScreen() {
  const [selectedDate, setSelectedDate] = useState(INITIAL_DATE);
  const [danceStyleFilter, setDanceStyleFilter] = useState<string | null>(null);
  const [liveFilter, setLiveFilter] = useState(BOUNDARY);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const sheetRef = useRef<SheetRef>(null);
  const mapRef = useRef<MapRef>(null);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      if (navigation.isFocused()) {
        sheetRef.current?.toggle();
      }
    });
    return unsubscribe;
  }, [navigation]);

  const { events, loading } = useEvents(selectedDate);
  const userLocation = useUserLocation();
  const filteredEvents = useMemo(
    () => filterEvents(events, danceStyleFilter, liveFilter),
    [events, danceStyleFilter, liveFilter],
  );

  const isTodaySelected = selectedDate === INITIAL_DATE;

  useEffect(() => {
    if (!isTodaySelected) setLiveFilter(false);
  }, [isTodaySelected]);

  // Center map when an event is selected (only reacts to selectedEventId changes,
  // NOT filteredEvents changes, so filter switches don't re-center on stale selection)
  useEffect(() => {
    if (!selectedEventId) return;
    const event = filteredEvents.find((e) => e.event_id === selectedEventId);
    if (event) {
      mapRef.current?.centerOn(event.venue_lat, event.venue_lng);
    }
  }, [selectedEventId]);

  // Reset selection synchronously when filters change (batched in same render)
  const handleDanceStyleFilter = useCallback((style: string | null) => {
    setDanceStyleFilter(style);
    setSelectedEventId(null);
  }, []);

  const toggleLiveFilter = useCallback(() => {
    setLiveFilter((v) => !v);
    setSelectedEventId(null);
  }, []);

  const handlePinPress = useCallback((eventId: string) => {
    setSelectedEventId(eventId);
  }, []);

  const handleMapPress = useCallback(() => {
    setSelectedEventId(null);
  }, []);

  const handleMapPan = useCallback(() => {
    sheetRef.current?.peek();
  }, []);

  const handleFitAll = useCallback(() => {
    setSelectedEventId(null);
    sheetRef.current?.peek();
    mapRef.current?.fitAll();
  }, []);

  return (
    <View style={styles.container}>
        <EventMap
          ref={mapRef}
          events={filteredEvents}
          selectedEventId={selectedEventId}
          onPinPress={handlePinPress}
          onMapPress={handleMapPress}
          onMapPan={handleMapPan}
          userLocation={userLocation}
        />

      <DateToggle
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />
        <TouchableOpacity
          style={[styles.fitButton, { top: insets.top + 62 }]}
          onPress={handleFitAll}
          activeOpacity={0.7}
        >
          <Ionicons name="locate-outline" size={20} color={Colors.text} />
        </TouchableOpacity>

      <EventBottomSheet
        ref={sheetRef}
        events={filteredEvents}
        loading={loading}
        selectedEventId={selectedEventId}
        onEventSelect={setSelectedEventId}
        liveFilter={liveFilter}
        pollComponent={<PollButton date={selectedDate} />}
        headerComponent={
          <FilterPills
            selectedDanceStyle={danceStyleFilter}
            onDanceStyleSelect={handleDanceStyleFilter}
            liveFilter={liveFilter}
            onLiveToggle={toggleLiveFilter}
            liveDisabled={!isTodaySelected}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  fitButton: {
    position: "absolute",
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
