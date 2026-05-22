import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@/components/ui/Icon";
import { useNavigation, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
import { useEvents } from "@/hooks/useEvents";
import { filterEvents } from "@/lib/eventFilters";
import { isValidEventId, isValidDateKey } from "@/lib/eventShare";
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
  const linkParams = useLocalSearchParams<{ eventId?: string; date?: string }>();
  // Cold start from an event link: begin on that event's date so the first
  // useEvents fetch already targets the right list.
  const [selectedDate, setSelectedDate] = useState(() => {
    const linkDate = typeof linkParams.date === "string" ? linkParams.date : null;
    return linkDate && isValidDateKey(linkDate) ? linkDate : INITIAL_DATE;
  });
  const [danceStyleFilter, setDanceStyleFilter] = useState<string | null>(null);
  const [liveFilter, setLiveFilter] = useState(BOUNDARY);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  // Event id from a deep link, held until that event appears in the loaded
  // list — then promoted to selectedEventId (centres pin + expands card).
  const [pendingEventId, setPendingEventId] = useState<string | null>(null);
  const handledLink = useRef<string | null>(null);
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

  // Consume an event deep link (bailando:///?eventId=...&date=...). Fires on
  // cold start and whenever a fresh link arrives while the app is open.
  useEffect(() => {
    const eventId =
      typeof linkParams.eventId === "string" ? linkParams.eventId : null;
    if (!eventId || !isValidEventId(eventId)) return;

    // Consume each unique link once — later interaction leaves the URL params
    // in place and must not re-trigger the jump.
    const linkKey = `${eventId}|${linkParams.date ?? ""}`;
    if (handledLink.current === linkKey) return;
    handledLink.current = linkKey;

    if (typeof linkParams.date === "string" && isValidDateKey(linkParams.date)) {
      setSelectedDate(linkParams.date);
    }
    // Clear filters so a stale filter can't hide the shared event.
    setDanceStyleFilter(null);
    setLiveFilter(false);
    setPendingEventId(eventId);
  }, [linkParams.eventId, linkParams.date]);

  // Promote the pending deep-link event once it's actually in the loaded list.
  // If it never loads — unpublished, past, or not visible to this user — the
  // app just stays on the normal tonight view; the link silently does nothing.
  useEffect(() => {
    if (!pendingEventId) return;
    const match = filteredEvents.find((e) => e.event_id === pendingEventId);
    if (match) {
      setSelectedEventId(pendingEventId);
      setPendingEventId(null);
    }
  }, [pendingEventId, filteredEvents]);

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
    zIndex: 1,
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
