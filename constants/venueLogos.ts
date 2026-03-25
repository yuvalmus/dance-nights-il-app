import { ImageSourcePropType } from 'react-native';

/**
 * Maps venue slugs to their local logo assets.
 */
const VENUE_LOGOS: Record<string, ImageSourcePropType> = {
  'v-dance-studio': require('@/assets/venues/VDance.png'),
  'sol-dance': require('@/assets/venues/SolDance.png'),
  'bachata-nation': require('@/assets/venues/BachataNation.png'),
  'baila': require('@/assets/venues/Baila.png'),
  'capital-latina': require('@/assets/venues/CapitalLatina.png'),
  'zoukera': require('@/assets/venues/Zoukera.png'),
  'be-bachata': require('@/assets/venues/BeBachata.png'),
  'havana': require('@/assets/venues/Havana.png'),
};

export function getVenueLogo(venueSlug: string): ImageSourcePropType | null {
  return VENUE_LOGOS[venueSlug] ?? null;
}
