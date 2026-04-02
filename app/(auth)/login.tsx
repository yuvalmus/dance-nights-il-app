import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/lib/auth';

const bailandoLogoSlogan = require('@/assets/Bailando-slogan.png');
const BAILANDO_SLOGAN_WIDTH = 2200;
const BAILANDO_SLOGAN_HEIGHT = 700;

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      router.replace('/(tabs)/profile');
    } catch (err) {
      console.error('Sign in error:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
        <Ionicons name="close" size={28} color={Colors.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Image
          source={bailandoLogoSlogan}
          style={styles.logo}
          transition={200}
        />
        <Text style={styles.subtitle}>גלה איפה רוקדים הלילה</Text>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
            <Ionicons name="logo-google" size={22} color="#fff" />
            <Text style={styles.googleButtonText}>התחבר עם Google</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          ניתן לגלוש ללא התחברות.{'\n'}
          התחברות נדרשת להצבעה בסקר ושמירת מועדפים.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  logo: {
    width: '100%',
    aspectRatio: BAILANDO_SLOGAN_WIDTH / BAILANDO_SLOGAN_HEIGHT,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 48,
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#4285F4',
    paddingVertical: 16,
    borderRadius: 12,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 20,
  },
});
