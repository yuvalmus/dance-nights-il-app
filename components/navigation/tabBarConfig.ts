import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

export const TAB_BAR_CONFIG = {
  /** Height of the flat portion of the bar (excluding safe area inset) */
  barHeight: 60,
  /** Diameter of the elevated center circle */
  circleSize: 64,
  /** How far the convex hill rises above the flat bar edge */
  curveRise: 30,
  /** Width of the convex hill region */
  curveWidth: 170,
  /** Duration of the show/hide slide animation (ms) */
  visibilityDuration: 300,
  /** Icon size for side tabs */
  iconSize: 32,
  /** Icon size for the center button */
  centerIconSize: 36,
  /** Shadow elevation for Android */
  elevation: 12,
};

export interface CurvedTabBarRef {
  /** Animate the tab bar in or out of view */
  setVisible: (visible: boolean) => void;
}

export interface TabBadge {
  /** Route name to attach the badge to */
  route: string;
  /** Number to display (0 or undefined = hidden, -1 = dot only) */
  count?: number;
}

export interface CurvedTabBarProps extends BottomTabBarProps {
  /** Optional badges to display on tabs */
  badges?: TabBadge[];
}
