import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';

type Props = {
  isNew: boolean;
  danceStyle: string | null;
};

export function CoursePosterOverlay({ isNew, danceStyle }: Props) {

  return (
    <>
      {/* Bottom gradient for readability */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.gradient}
      />

      {isNew && (
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>חדש</Text>
        </View>
      )}

      {danceStyle && (
        <View style={styles.styleBadge}>
          <Text style={styles.styleBadgeText}>{danceStyle}</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  newBadge: {
    position: 'absolute',
    top: 12,
    alignSelf: 'flex-start',
    marginHorizontal: 14,
    backgroundColor: Colors.error,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  newBadgeText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  styleBadge: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'flex-end',
    marginHorizontal: 14,
    backgroundColor: 'rgba(212, 160, 23, 0.4)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
  },
  styleBadgeText: {
    color: Colors.primary,
    fontSize: 12,
    letterSpacing: 0.7,
  },
});
