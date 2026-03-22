import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { Course } from '@/types/database';
import { DANCE_STYLE_LABELS } from '@/constants/config';

type Props = {
  course: Course;
};

const TYPE_LABELS: Record<string, string> = {
  course: 'קורס',
  bootcamp: 'בוטקמפ',
  festival: 'פסטיבל',
};

export function CourseCard({ course }: Props) {
  const openRegistration = () => {
    if (course.registration_url) Linking.openURL(course.registration_url);
  };

  return (
    <View style={styles.card}>
      {course.poster_url && (
        <Image
          source={{ uri: course.poster_url }}
          style={styles.poster}
          contentFit="cover"
          transition={200}
        />
      )}

      <View style={styles.content}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{TYPE_LABELS[course.type] ?? course.type}</Text>
        </View>

        <Text style={styles.title}>{course.title}</Text>

        {course.instructor && (
          <Text style={styles.instructor}>
            <Ionicons name="person" size={13} color={Colors.textSecondary} /> {course.instructor}
          </Text>
        )}

        <View style={styles.details}>
          {course.schedule && <Text style={styles.detail}>{course.schedule}</Text>}
          {course.level && <Text style={styles.detail}>{course.level}</Text>}
          {course.price && <Text style={styles.price}>{course.price}</Text>}
        </View>

        {course.dance_styles.length > 0 && (
          <View style={styles.tags}>
            {course.dance_styles.map((s) => (
              <View
                key={s}
                style={[styles.tag, { backgroundColor: Colors.primary }]}
              >
                <Text style={styles.tagText}>
                  {DANCE_STYLE_LABELS[s as keyof typeof DANCE_STYLE_LABELS] ?? s}
                </Text>
              </View>
            ))}
          </View>
        )}

        {course.registration_url && (
          <TouchableOpacity style={styles.cta} onPress={openRegistration}>
            <Text style={styles.ctaText}>הרשמה</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  poster: {
    width: '100%',
    height: 160,
  },
  content: {
    padding: 14,
    alignItems: 'flex-end',
  },
  typeBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  typeBadgeText: {
    color: Colors.background,
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
  },
  instructor: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  details: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginTop: 8,
  },
  detail: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  price: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  tags: {
    flexDirection: 'row-reverse',
    gap: 6,
    marginTop: 10,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  cta: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 12,
  },
  ctaText: {
    color: Colors.background,
    fontWeight: '700',
    fontSize: 14,
  },
});
