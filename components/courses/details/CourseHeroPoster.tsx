import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, StatusBar } from 'react-native';
import { useState, useCallback } from 'react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';

type Props = {
  posterUrl: string | null;
  title: string;
};

export default function CourseHeroPoster({ posterUrl, title }: Props) {
  const [fullscreen, setFullscreen] = useState(false);

  const openFullscreen = useCallback(() => setFullscreen(true), []);
  const closeFullscreen = useCallback(() => setFullscreen(false), []);

  return (
    <>
      <View style={styles.container}>
        {posterUrl ? (
          <Image
            source={{ uri: posterUrl }}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="musical-notes" size={56} color={Colors.textMuted} />
          </View>
        )}

        {/* Black bottom gradient — matches course card poster overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        />

        <Text style={styles.title}>{title}</Text>

        {posterUrl && (
          <TouchableOpacity style={styles.expandBtn} onPress={openFullscreen}>
            <Ionicons name="expand" size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {fullscreen && posterUrl && (
        <Modal visible animationType="fade" transparent onRequestClose={closeFullscreen}>
          <Pressable style={styles.fullscreenOverlay} onPress={closeFullscreen}>
            <Image
              source={{ uri: posterUrl }}
              style={styles.fullscreenImage}
              contentFit="contain"
            />
            <TouchableOpacity style={styles.closeBtn} onPress={closeFullscreen}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    position: 'relative',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  title: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    color: Colors.text,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  expandBtn: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
