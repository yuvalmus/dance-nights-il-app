import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons,MaterialCommunityIcons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/hooks/useProfile';
import { DANCE_STYLES, DANCE_LEVELS, DANCE_STYLE_LABELS, DANCE_LEVEL_LABELS, DanceLevel } from '@/constants/config';
import { useVenue } from '@/hooks/useVenue';
import MyVenueSection from '@/components/venue/MyVenueSection';
import PillSelect from '@/components/ui/PillSelect';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { venue, venueEvents, toggleEventPublish, deleteEvent } = useVenue();
  const router = useRouter();

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginPrompt}>
          <MaterialCommunityIcons name="human-female-dance" size={60} color={Colors.textMuted} />
          <Text style={styles.loginTitle}>התחבר כדי לשמור העדפות</Text>
          <Text style={styles.loginSubtitle}>
            ניתן לגלוש באפליקציה ללא התחברות
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginButtonText}>התחברות</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const toggleDanceStyle = async (danceStyle: string) => {
    if (!profile) return;
    const current = profile.dance_styles || [];
    const updated = current.includes(danceStyle)
      ? current.filter((s) => s !== danceStyle)
      : [...current, danceStyle];
    await updateProfile({ dance_styles: updated });
  };

  const handleLevelToggle = async (value: string) => {
    await updateProfile({ dance_level: value as DanceLevel });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>פרופיל</Text>

        {/* User info */}
        <View style={styles.card}>
          <MaterialCommunityIcons name="human-female-dance" size={35} color={Colors.primary} />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {profile?.display_name || 'רקדן/ית'}
            </Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        </View>

        {/* Venue owner section */}
        {venue && (
          <MyVenueSection
            venue={venue}
            events={venueEvents}
            onTogglePublish={toggleEventPublish}
            onDelete={deleteEvent}
          />
        )}

        {/* Dance level */}
        <Text style={styles.sectionTitle}>רמת ריקוד</Text>
        <View style={styles.pillRow}>
          <PillSelect
            items={DANCE_LEVELS.map((l) => ({ value: l, label: DANCE_LEVEL_LABELS[l] }))}
            selected={profile?.dance_level ? [profile.dance_level] : []}
            onToggle={handleLevelToggle}
            mode="single"
            allowEmpty={false}
          />
        </View>

        {/* Dance styles */}
        <Text style={styles.sectionTitle}>סגנונות ריקוד</Text>
        <View style={styles.pillRow}>
          <PillSelect
            items={DANCE_STYLES.map((s) => ({ value: s, label: DANCE_STYLE_LABELS[s] }))}
            selected={profile?.dance_styles || []}
            onToggle={toggleDanceStyle}
          />
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.signOutText}>התנתק</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'right',
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  userInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  userName: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  userEmail: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 12,
  },
  pillRow: {
    marginBottom: 24,
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loginTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  loginSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 24,
  },
  loginButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  signOutButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  signOutText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: '500',
  },
});
