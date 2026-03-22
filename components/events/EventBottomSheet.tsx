import React, { useCallback, useMemo, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { TAB_BAR_CONFIG } from '@/components/navigation/tabBarConfig';
import { EventWithVenue } from '@/types/database';
import { EventCard } from './EventCard';

export type SheetRef = {
  toggle: () => void;
};

type Props = {
  events: EventWithVenue[];
  eventDate: string;
  loading: boolean;
  selectedEventId: string | null;
  onEventSelect: (id: string | null) => void;
  headerComponent?: React.ReactNode;
  pollComponent?: React.ReactNode;
};

const SCREEN_HEIGHT = Dimensions.get('window').height;

// Peek must clear the center button (curveRise + circleSize/2 above the flat bar edge)
const PEEK_HEIGHT =
  TAB_BAR_CONFIG.curveRise + TAB_BAR_CONFIG.circleSize / 2;

export const EventBottomSheet = forwardRef<SheetRef, Props>(({
  events,
  eventDate,
  loading,
  selectedEventId,
  onEventSelect,
  headerComponent,
  pollComponent,
}, ref) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const isOpen = useRef(true);
  const insets = useSafeAreaInsets();

  const bottomInset = TAB_BAR_CONFIG.barHeight + insets.bottom;
  const pullTabBottom = TAB_BAR_CONFIG.barHeight + TAB_BAR_CONFIG.curveRise + insets.bottom;

  const snapPoints = useMemo(() => {
    const mid = SCREEN_HEIGHT * 0.5 - bottomInset;
    const full = SCREEN_HEIGHT * 0.85 - bottomInset;
    return [PEEK_HEIGHT, mid, full];
  }, [bottomInset]);

  const openSheet = useCallback(() => {
    isOpen.current = true;
    bottomSheetRef.current?.snapToIndex(selectedEventId ? 2 : 1);
  }, [selectedEventId]);

  useImperativeHandle(ref, () => ({
    toggle() {
      if (isOpen.current) {
        isOpen.current = false;
        bottomSheetRef.current?.close();
      } else {
        openSheet();
      }
    },
  }), [openSheet]);

  const handleSheetChange = useCallback((index: number) => {
    isOpen.current = index >= 0;
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      bottomSheetRef.current?.snapToIndex(2);
    }
  }, [selectedEventId]);

  const handleEventPress = useCallback(
    (id: string) => {
      onEventSelect(selectedEventId === id ? null : id);
    },
    [selectedEventId, onEventSelect],
  );

  const renderItem = useCallback(
    ({ item }: { item: EventWithVenue }) => (
      <EventCard
        event={item}
        eventDate={eventDate}
        isExpanded={selectedEventId === item.event_id}
        onPress={() => handleEventPress(item.event_id)}
      />
    ),
    [selectedEventId, handleEventPress, eventDate],
  );

  return (
    <>
      <View style={[styles.pullTab, { bottom: pullTabBottom }]}>
        <TouchableOpacity
          onPress={openSheet}
          style={styles.pullTabTouch}
          activeOpacity={0.7}
        >
          <View style={styles.pullTabBar} />
        </TouchableOpacity>
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        bottomInset={bottomInset}
        enableDynamicSizing={false}
        enablePanDownToClose
        onChange={handleSheetChange}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.indicator}
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.headerText}>
              {loading ? 'טוען...' : `${events.length} אירועים`}
            </Text>
            {pollComponent}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : (
          <BottomSheetFlatList
            data={events}
            keyExtractor={(item) => item.event_id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={<>{headerComponent}</>}
            ListEmptyComponent={
              <Text style={styles.empty}>אין אירועים בתאריך זה</Text>
            }
          />
        )}
      </BottomSheet>
    </>
  );
});

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
  headerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
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
  pullTab: {
    position: 'absolute',
    alignSelf: 'center',
  },
  pullTabTouch: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pullTabBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
});
