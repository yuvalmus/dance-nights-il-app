import { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import SearchBar from '@/components/ui/SearchBar';
import { getVenueLogo } from '@/constants/venueLogos';
import { useVenueSearch, VenueCandidate } from '@/hooks/useVenueSearch';

type Props = {
  /** Currently selected venue, if any. */
  value: VenueCandidate | null;
  onSelect: (venue: VenueCandidate | null) => void;
  placeholder?: string;
};

/**
 * Searchable venue picker. Shows the selected venue as a logo chip until
 * cleared, at which point the search UI takes over. Used by the course
 * form so artists can route a course to any venue for approval.
 */
export default function VenueSearchBox({
  value,
  onSelect,
  placeholder = 'חפש מקום...',
}: Props) {
  const [query, setQuery] = useState('');
  const { results } = useVenueSearch(query);

  if (value) {
    return <SelectedVenueChip venue={value} onClear={() => onSelect(null)} />;
  }

  const handlePick = (venue: VenueCandidate) => {
    onSelect(venue);
    setQuery('');
  };

  return (
    <View>
      <SearchBar value={query} onChangeText={setQuery} placeholder={placeholder} />
      {query.trim().length > 0 && (
        <View style={styles.results}>
          {results.length === 0 && (
            <Text style={styles.empty}>אין התאמות</Text>
          )}
          {results.map((venue) => (
            <VenueRow key={venue.id} venue={venue} onPick={handlePick} />
          ))}
        </View>
      )}
    </View>
  );
}

function SelectedVenueChip({
  venue,
  onClear,
}: {
  venue: VenueCandidate;
  onClear: () => void;
}) {
  const logo = getVenueLogo(venue.slug);
  const themed = venue.theme_colors?.[0] ?? Colors.primary;
  return (
    <View style={styles.chip}>
      <TouchableOpacity onPress={onClear} hitSlop={8} style={styles.chipClear}>
        <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
      <View style={styles.chipMeta}>
        <Text style={[styles.chipName, { color: themed }]}>{venue.name}</Text>
        <Text style={styles.chipCity}>{venue.city}</Text>
      </View>
      {logo && <Image source={logo} style={styles.chipLogo} />}
    </View>
  );
}

function VenueRow({
  venue,
  onPick,
}: {
  venue: VenueCandidate;
  onPick: (v: VenueCandidate) => void;
}) {
  const logo = getVenueLogo(venue.slug);
  return (
    <TouchableOpacity style={styles.row} onPress={() => onPick(venue)}>
      <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
      <View style={styles.rowMeta}>
        <Text style={styles.rowName}>{venue.name}</Text>
        <Text style={styles.rowCity}>{venue.city}</Text>
      </View>
      {logo ? (
        <Image source={logo} style={styles.rowLogo} />
      ) : (
        <View style={[styles.rowLogo, styles.logoPlaceholder]}>
          <Ionicons name="business" size={16} color={Colors.textMuted} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  results: {
    marginTop: 8,
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
  rowMeta: {
    flex: 1,
    alignItems: 'flex-end',
  },
  rowName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  rowCity: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  rowLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  logoPlaceholder: {
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    color: Colors.textMuted,
    padding: 12,
    textAlign: 'center',
    fontSize: 13,
  },
  chip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    padding: 12,
  },
  chipLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  chipMeta: {
    flex: 1,
    alignItems: 'flex-end',
  },
  chipName: {
    fontSize: 15,
    fontWeight: '700',
  },
  chipCity: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  chipClear: {
    padding: 2,
  },
});
