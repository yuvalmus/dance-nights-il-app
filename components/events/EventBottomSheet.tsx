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
  peek: () => void;
};

type Props = {
  events: EventWithVenue[];
  loading: boolean;
  selectedEventId: string | null;
  onEventSelect: (id: string | null) => void;
  headerComponent?: React.ReactNode;
  pollComponent?: React.ReactNode;
  liveFilter?: boolean;
};

const SCREEN_HEIGHT = Dimensions.get('window').height;

const PEEK_HEIGHT =
  TAB_BAR_CONFIG.curveRise + TAB_BAR_CONFIG.circleSize / 2;

export const EventBottomSheet = forwardRef<SheetRef, Props>(({
  events,
  loading,
  selectedEventId,
  onEventSelect,
  headerComponent,
  pollComponent,
  liveFilter,
}, ref) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const flatListRef = useRef<any>(null);
  const isOpen = useRef(true);
  const insets = useSafeAreaInsets();

  const bottomInset = TAB_BAR_CONFIG.barHeight + insets.bottom;
  const pullTabBottom = TAB_BAR_CONFIG.barHeight + TAB_BAR_CONFIG.curveRise + insets.bottom;

  const snapPoints = useMemo(() => {
    const available = SCREEN_HEIGHT - bottomInset;
    const mid = available * 0.45;
    const full = available * 0.85;
    return [PEEK_HEIGHT, Math.max(mid, PEEK_HEIGHT + 50), Math.max(full, PEEK_HEIGHT + 100)];
  }, [bottomInset]);

  const openSheet = useCallback(() => {
    isOpen.current = true;
    bottomSheetRef.current?.snapToIndex(selectedEventId ? 1 : 1);
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
    peek() {
      isOpen.current = true;
      bottomSheetRef.current?.snapToIndex(0);
    },
  }), [openSheet]);

  const handleSheetChange = useCallback((index: number) => {
    isOpen.current = index >= 0;
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;

    bottomSheetRef.current?.snapToIndex(1);

    const eventIndex = events.findIndex((e) => e.event_id === selectedEventId);
    if (eventIndex >= 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: eventIndex, animated: true, viewOffset: 8 });
      }, 300);
    }
  }, [selectedEventId, events]);

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
        isExpanded={selectedEventId === item.event_id}
        onPress={() => handleEventPress(item.event_id)}
      />
    ),
    [selectedEventId, handleEventPress],
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
          {headerComponent}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : (
          <BottomSheetFlatList
            ref={flatListRef}
            data={events}
            keyExtractor={(item) => item.event_id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {liveFilter ? 'אין אירועים פעילים כרגע' : 'אין אירועים בתאריך זה'}
              </Text>
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
