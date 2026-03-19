import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { Colors } from '@/constants/colors';
import { EventWithVenue } from '@/types/database';
import { EventCard } from './EventCard';

type Props = {
  events: EventWithVenue[];
  loading: boolean;
  selectedEventId: string | null;
  onEventSelect: (id: string) => void;
  headerComponent?: React.ReactNode;
};

export function EventBottomSheet({
  events,
  loading,
  selectedEventId,
  onEventSelect,
  headerComponent,
}: Props) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['12%', '45%', '85%'], []);

  const renderItem = useCallback(
    ({ item }: { item: EventWithVenue }) => (
      <EventCard
        event={item}
        isExpanded={selectedEventId === item.event_id}
        onPress={() => onEventSelect(item.event_id)}
      />
    ),
    [selectedEventId, onEventSelect]
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={1}
      snapPoints={snapPoints}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.indicator}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {loading ? 'טוען...' : `${events.length} אירועים`}
        </Text>
        {headerComponent}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.event_id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.empty}>אין אירועים בתאריך זה</Text>
          }
        />
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  indicator: {
    backgroundColor: Colors.textMuted,
    width: 40,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 8,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  loader: {
    marginTop: 20,
  },
  empty: {
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});
