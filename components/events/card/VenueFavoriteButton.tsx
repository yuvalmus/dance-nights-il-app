import { useCallback } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { useUserFavorites } from '@/hooks/useUserFavorites';

type Props = {
  venueId: string;
};

/**
 * Heart toggle next to the venue name. Tapping while signed out routes to
 * the login screen — favouriting only makes sense with an account.
 */
export default function VenueFavoriteButton({ venueId }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const { isFavorite, toggle } = useUserFavorites();
  const favorited = isFavorite('venue', venueId);

  const handlePress = useCallback(() => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    void toggle('venue', venueId);
  }, [user, router, toggle, venueId]);

  return (
    <TouchableOpacity onPress={handlePress} hitSlop={8} style={styles.btn}>
      <Ionicons
        name={favorited ? 'heart' : 'heart-outline'}
        size={18}
        color={favorited ? Colors.primary : Colors.textSecondary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 2,
  },
});
