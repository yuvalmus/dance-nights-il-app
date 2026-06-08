import { View, Text, StyleSheet, Switch } from 'react-native';
import { Colors } from '@/constants/colors';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { NotificationPreferenceKey } from '@/types/database';

type Row = { key: NotificationPreferenceKey; label: string; subtitle?: string };

const ROWS: Row[] = [
  { key: 'social',          label: 'חברים מגיעים',         subtitle: 'כשחבר מסמן הגעה לאירוע או קורס' },
  { key: 'friend_requests', label: 'בקשות חברות',           subtitle: 'בקשה חדשה ואישור בקשה' },
  { key: 'management',      label: 'ניהול קורסים ומדריכים', subtitle: 'אישורי קורסים והזמנות מדריך' },
  { key: 'event_updates',   label: 'עדכונים על אירועים',    subtitle: 'שינוי תאריך וביטול אירוע' },
  { key: 'favorites',       label: 'מועדפים',               subtitle: 'אירועים וקורסים חדשים במקומות ומדריכים שאהבת' },
  { key: 'reminders',       label: 'תזכורות',               subtitle: 'תזכורת לפני אירוע ומקומות שהולכים להיגמר' },
];

/**
 * Per-category push toggles. The in-app inbox always receives every row;
 * these only control device-level pushes (Edge Function checks the bucket
 * before dispatching).
 */
export default function NotificationPreferencesSection() {
  const { prefs, loading, setPreference } = useNotificationPreferences();

  if (loading) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>התראות מכשיר</Text>
      <Text style={styles.intro}>
        כל ההתראות נשמרות בתא הדואר. כאן את/ה שולט/ת על מה ייכנס למכשיר.
      </Text>

      {ROWS.map((row) => (
        <View key={row.key} style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            {row.subtitle && <Text style={styles.rowSubtitle}>{row.subtitle}</Text>}
          </View>
          <Switch
            value={prefs[row.key]}
            onValueChange={(v) => { void setPreference(row.key, v); }}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Colors.text}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 4,
  },
  intro: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    gap: 12,
  },
  rowText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  rowLabel: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  rowSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 2,
  },
});
