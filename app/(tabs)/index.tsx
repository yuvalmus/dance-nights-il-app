import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useNavigation } from "expo-router";
import { Colors } from "@/constants/colors";
import { useEvents, filterEvents } from "@/hooks/useEvents";
import { EventMap } from "@/components/map/EventMap";
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
  const navigation = useNavigation();

  // Toggle sheet when center tab is pressed while already focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      if (navigation.isFocused()) {
        sheetRef.current?.toggle();
      }
    });
    return unsubscribe;
  }, [navigation]);

  const { events, loading, error, refetch } = useEvents(selectedDate);
  const filteredEvents = useMemo(
    () => filterEvents(events, danceStyleFilter, liveFilter),
    [events, danceStyleFilter, liveFilter],
  );

  const isTodaySelected = selectedDate === INITIAL_DATE;

  useEffect(() => {
    if (!isTodaySelected) setLiveFilter(false);
  }, [isTodaySelected]);

  const toggleLiveFilter = useCallback(() => setLiveFilter((v) => !v), []);

  const handlePinPress = useCallback((eventId: string) => {
    setSelectedEventId(eventId);
  }, []);

  return (
    <View style={styles.container}>
      <EventMap
        events={filteredEvents}
        selectedEventId={selectedEventId}
        onPinPress={handlePinPress}
      />

      <DateToggle
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />

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
            onDanceStyleSelect={setDanceStyleFilter}
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
});
