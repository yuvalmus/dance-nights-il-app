import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/lib/auth';

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      router.back();
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
        <Text style={styles.logo}>NOCHE</Text>
        <Text style={styles.subtitle}>גלה איפה רוקדים הלילה</Text>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
            <Ionicons name="logo-google" size={22} color="#fff" />
            <Text style={styles.googleButtonText}>התחבר עם Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.appleButton}>
            <Ionicons name="logo-apple" size={22} color="#fff" />
            <Text style={styles.appleButtonText}>התחבר עם Apple</Text>
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
    top: 60,
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
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 6,
    marginBottom: 8,
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
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#333',
    paddingVertical: 16,
    borderRadius: 12,
  },
  appleButtonText: {
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
