import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import FormSection from '@/components/ui/FormSection';
import ActionButton from '@/components/ui/ActionButton';

type Props = {
  posterUri: string | null;
  onPickImage: () => void;
  onRemovePoster: () => void;
};

export default function PosterSection({ posterUri, onPickImage, onRemovePoster }: Props) {
  return (
    <FormSection title="פוסטר">
      {posterUri ? (
        <View style={styles.posterPreview}>
          <Image source={{ uri: posterUri }} style={styles.posterImage} />
          <TouchableOpacity style={styles.posterRemove} onPress={onRemovePoster}>
            <Ionicons name="close-circle" size={24} color={Colors.error} />
          </TouchableOpacity>
        </View>
      ) : null}
      <ActionButton
        label={posterUri ? 'החלף פוסטר' : 'בחר פוסטר'}
        variant="secondary"
        onPress={onPickImage}
      />
    </FormSection>
  );
}

const styles = StyleSheet.create({
  posterPreview: {
    position: 'relative',
    marginBottom: 12,
  },
  posterImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  posterRemove: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
});
