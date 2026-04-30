import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import FormInput from '@/components/ui/FormInput';
import { useInstructorSearch } from '@/hooks/useInstructorSearch';

type Props = {
  /** Display name to show — either a linked profile's name or free text. */
  name: string;
  /** UUID of the linked profile, or null when the name is free text. */
  instructorId: string | null;
  /**
   * Called whenever either field changes. Passing `instructorId=null`
   * signals free-text mode; anything else is a linked profile.
   */
  onChange: (name: string, instructorId: string | null) => void;
};

/**
 * Autocomplete-style instructor picker. Typing both filters existing
 * profiles AND doubles as a free-text fallback for instructors who
 * aren't app users. Verified artists surface first (via the RPC ordering).
 *
 * Flow:
 *  - User types → suggestions appear beneath the input.
 *  - Tap a suggestion → fills name + instructorId (linked profile).
 *  - Keep typing or ignore → instructorId stays null (free text).
 *  - Editing after linking → clears instructorId so the name is honest.
 */
export default function InstructorSearchBox({
  name,
  instructorId,
  onChange,
}: Props) {
  const [query, setQuery] = useState(name);
  const { results } = useInstructorSearch(instructorId ? '' : query);

  const handleChangeText = (text: string) => {
    setQuery(text);
    // Any manual edit breaks the link — the text now owns the truth.
    onChange(text, null);
  };

  const handlePick = (id: string, pickedName: string) => {
    setQuery(pickedName);
    onChange(pickedName, id);
  };

  const showResults = !instructorId && query.trim().length > 0 && results.length > 0;

  return (
    <View>
      <FormInput
        label="מדריך/ה"
        value={query}
        onChangeText={handleChangeText}
        placeholder="חפש משתמש או הקלד שם חופשי"
      />
      {instructorId && (
        <View style={styles.linkedHint}>
          <MaterialCommunityIcons
            name="check-decagram-outline"
            size={14}
            color={Colors.primary}
          />
          <Text style={styles.linkedHintText}>
            מקושר למשתמש קיים
          </Text>
        </View>
      )}

      {showResults && (
        <View style={styles.results}>
          {results.map((candidate) => (
            <TouchableOpacity
              key={candidate.id}
              style={styles.row}
              onPress={() =>
                handlePick(candidate.id, candidate.display_name ?? '')
              }
            >
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
              <View style={styles.rowText}>
                <Text style={styles.rowName}>
                  {candidate.display_name ?? 'ללא שם'}
                </Text>
                {candidate.is_artist && (
                  <View style={styles.artistBadge}>
                    <MaterialCommunityIcons
                      name="check-decagram-outline"
                      size={12}
                      color={Colors.primary}
                    />
                    <Text style={styles.artistBadgeText}>אמן מאומת</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  linkedHint: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginTop: -12,
    marginBottom: 12,
  },
  linkedHintText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  results: {
    marginTop: -4,
    marginBottom: 16,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  rowName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  artistBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  artistBadgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
});
