import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';

type Props = {
  announcements: string[];
};

export default function CourseAnnouncementsSection({ announcements }: Props) {
  if (announcements.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      {announcements.map((text, i) => (
        <LinearGradient
          key={i}
          colors={['rgba(212, 160, 23, 0.3)', 'rgba(212, 160, 23, 0.15)', 'rgba(184, 134, 11, 0.2)']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.card}
        >
          <Text style={styles.text}>{text}</Text>
        </LinearGradient>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    gap: 10,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.35)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  text: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },
});
