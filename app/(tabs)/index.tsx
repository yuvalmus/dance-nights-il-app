import { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";
import { useEvents, filterEventsByStyle } from "@/hooks/useEvents";
import { EventMap } from "@/components/map/EventMap";
import { DateToggle } from "@/components/map/DateToggle";
import { EventBottomSheet } from "@/components/events/EventBottomSheet";
import { FilterPills } from "@/components/events/FilterPills";
import { PollButton } from "@/components/poll/PollButton";

const TODAY = new Date().toISOString().split("T")[0];

export default function TonightScreen() {
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [styleFilter, setStyleFilter] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const { events, loading, error, refetch } = useEvents(selectedDate);
  const filteredEvents = useMemo(
    () => filterEventsByStyle(events, styleFilter),
    [events, styleFilter],
  );

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
        todayString={TODAY}
        onDateSelect={setSelectedDate}
      />

      <PollButton date={selectedDate} />

      <EventBottomSheet
        events={filteredEvents}
        loading={loading}
        selectedEventId={selectedEventId}
        onEventSelect={setSelectedEventId}
        headerComponent={
          <FilterPills
            selectedStyle={styleFilter}
            onStyleSelect={setStyleFilter}
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
