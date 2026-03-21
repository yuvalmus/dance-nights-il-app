import { useState, useRef, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useEvents, filterEventsByStyle } from "@/hooks/useEvents";
import { EventMap } from "@/components/map/EventMap";
import { DateRibbon } from "@/components/map/DateRibbon";
import { EventBottomSheet } from "@/components/events/EventBottomSheet";
import { FilterPills } from "@/components/events/FilterPills";
import { PollButton } from "@/components/poll/PollButton";
import { MaterialCommunityIcons } from "@expo/vector-icons";

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

export default function TonightScreen() {
  const [selectedDate, setSelectedDate] = useState(getTodayString());
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
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <DateRibbon
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
      </SafeAreaView>

      <EventMap
        events={filteredEvents}
        selectedEventId={selectedEventId}
        onPinPress={handlePinPress}
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
  safeArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
