import { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@/components/ui/Icon';
import { useVenue } from '@/hooks/useVenue';
import { getVenueLogo } from '@/constants/venueLogos';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import VenueEventsList from '@/components/venue/VenueEventsList';
import MyCoursesSection from '@/components/courses/MyCoursesSection';
import InstructorSection from '@/components/venue/InstructorSection';

type TabKey = 'events' | 'courses' | 'instructors';

const TABS = [
  { key: 'events' as const, label: 'אירועים' },
  { key: 'courses' as const, label: 'קורסים' },
  { key: 'instructors' as const, label: 'מדריכים' },
];

/**
 * Venue-owner management hub. Pulls events / courses / instructors out of
 * the profile screen so the profile stays focused on the user's identity
 * and personal preferences.
 */
export default function VenueManageScreen() {
  const { venue, venueEvents, toggleEventPublish, deleteEvent, loading } = useVenue();
  const [active, setActive] = useState<TabKey>('events');

  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'ניהול המקום' }} />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!venue) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'ניהול המקום' }} />
        <Text style={styles.empty}>אין לך מקום משויך לניהול.</Text>
      </View>
    );
  }

  const logo = getVenueLogo(venue.slug);

  // Venue editing UI is a future feature — surface the affordance now so
  // the layout doesn't shift later, and gently tell the user it's coming.
  const handleEditVenue = () => {
    Alert.alert('בקרוב', 'עריכת פרטי המקום תתאפשר בקרוב.');
  };

  return (
    <>
      <Stack.Screen options={{ title: 'ניהול המקום' }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Venue header — logo, name, edit pencil */}
        <View style={styles.headerCard}>
          {logo ? (
            <Image source={logo} style={styles.logo} />
          ) : (
            <View style={[styles.logo, styles.logoPlaceholder]}>
              <Ionicons name="business" size={28} color={Colors.primary} />
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.venueName}>{venue.name}</Text>
            {venue.city ? (
              <Text style={styles.venueCity}>{venue.city}</Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={handleEditVenue} hitSlop={8} style={styles.editBtn}>
            <Ionicons name="pencil" size={18} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Tab bar */}
        <SegmentedTabs tabs={TABS} active={active} onChange={setActive} />

        {/* Tab content */}
        <View style={styles.tabContent}>
          {active === 'events' && (
            <VenueEventsList
              events={venueEvents}
              onTogglePublish={toggleEventPublish}
              onDelete={deleteEvent}
            />
          )}
          {active === 'courses' && (
            <MyCoursesSection venueId={venue.id} canCreate />
          )}
          {active === 'instructors' && <InstructorSection venueId={venue.id} />}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
    paddingBottom: 60,
    gap: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 24,
  },
  empty: {
    color: Colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
  headerCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  logoPlaceholder: {
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  venueName: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  venueCity: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  editBtn: {
    padding: 6,
  },
  tabContent: {
    minHeight: 200,
  },
});
