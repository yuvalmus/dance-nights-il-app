// Map defaults — centered on Tel Aviv
export const MAP_CONFIG = {
  initialRegion: {
    latitude: 32.0853,
    longitude: 34.7818,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  },
};

// Dance styles available in the app
export const DANCE_STYLES = ['bachata', 'salsa', 'zouk'] as const;
export type DanceStyle = (typeof DANCE_STYLES)[number];

// Dance levels
export const DANCE_LEVELS = ['beginner', 'intermediate', 'master'] as const;
export type DanceLevel = (typeof DANCE_LEVELS)[number];

// Hebrew labels
export const DANCE_STYLE_LABELS: Record<DanceStyle, string> = {
  bachata: "בצ'אטה",
  salsa: 'סלסה',
  zouk: 'זוק',
};

export const DANCE_LEVEL_LABELS: Record<DanceLevel, string> = {
  beginner: 'מתחילים',
  intermediate: 'מתקדמים',
  master: 'מאסטר',
};

// Course types
export const COURSE_TYPES = ['course', 'bootcamp', 'festival'] as const;
export type CourseType = (typeof COURSE_TYPES)[number];

// Date ribbon: how many days ahead to show
export const DATE_RIBBON_DAYS = 7;
