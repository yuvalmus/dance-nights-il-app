import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@/components/ui/Icon';

type Props = {
  posterUrl: string;
  onFullscreen: () => void;
};

export function HeroPoster({ posterUrl, onFullscreen }: Props) {
  return (
    <View style={styles.wrap}>
      <Image
        source={{ uri: posterUrl }}
        style={styles.image}
        contentFit="cover"
        transition={300}
      />
      <TouchableOpacity style={styles.expandBtn} onPress={onFullscreen}>
        <Ionicons name="expand" size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 160,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  expandBtn: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
