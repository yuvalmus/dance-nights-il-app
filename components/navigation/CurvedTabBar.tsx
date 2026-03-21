import React, { useCallback, useImperativeHandle, forwardRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  LayoutChangeEvent,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { TAB_BAR_CONFIG, CurvedTabBarRef, CurvedTabBarProps } from './tabBarConfig';
import { buildCurvedUpPath } from './buildCurvedPath';
import { TabBadge } from './TabBadge';

const CurvedTabBar = forwardRef<CurvedTabBarRef, CurvedTabBarProps>(
  ({ state, descriptors, navigation, badges = [] }, ref) => {
    const insets = useSafeAreaInsets();
    const [barWidth, setBarWidth] = useState(Dimensions.get('window').width);

    const translateY = useSharedValue(0);
    const centerScale = useSharedValue(1);

    // Total SVG height = curveRise (the hill above flat) + barHeight + safe area
    const svgHeight = TAB_BAR_CONFIG.curveRise + TAB_BAR_CONFIG.barHeight + insets.bottom;
    const wrapperHeight = svgHeight;

    // ── Visibility API (animated slide down/up) ───────────────────────────
    useImperativeHandle(ref, () => ({
      setVisible: (visible: boolean) => {
        translateY.value = withTiming(visible ? 0 : wrapperHeight, {
          duration: TAB_BAR_CONFIG.visibilityDuration,
          easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        });
      },
    }));

    const animatedContainerStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));

    // ── Center button press animation ─────────────────────────────────────
    const onCenterPressIn = useCallback(() => {
      centerScale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
    }, []);
    const onCenterPressOut = useCallback(() => {
      centerScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    }, []);
    const centerButtonAnimStyle = useAnimatedStyle(() => ({
      transform: [{ scale: centerScale.value }],
    }));

    // ── Layout measurement ────────────────────────────────────────────────
    const onLayout = useCallback((e: LayoutChangeEvent) => {
      setBarWidth(e.nativeEvent.layout.width);
    }, []);

    // ── Split routes: left / center / right ───────────────────────────────
    const routes = state.routes;
    const centerIndex = Math.floor(routes.length / 2);
    const leftRoutes = routes.slice(0, centerIndex);
    const centerRoute = routes[centerIndex];
    const rightRoutes = routes.slice(centerIndex + 1);

    // ── Render a side tab ─────────────────────────────────────────────────
    const renderSideTab = (route: typeof routes[0]) => {
      const routeIndex = routes.indexOf(route);
      const { options } = descriptors[route.key];
      const isFocused = state.index === routeIndex;
      const badge = badges.find((b) => b.route === route.name);

      const onPress = () => {
        const event = navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });
        if (!isFocused && !event.defaultPrevented) {
          navigation.navigate(route.name, route.params);
        }
      };
      const onLongPress = () => {
        navigation.emit({ type: 'tabLongPress', target: route.key });
      };

      const color = isFocused ? Colors.primary : Colors.textMuted;

      return (
        <TouchableOpacity
          key={route.key}
          accessibilityRole="button"
          accessibilityState={isFocused ? { selected: true } : {}}
          accessibilityLabel={options.tabBarAccessibilityLabel}
          onPress={onPress}
          onLongPress={onLongPress}
          style={styles.sideTab}
          activeOpacity={0.7}
        >
          {options.tabBarIcon?.({ focused: isFocused, color, size: TAB_BAR_CONFIG.iconSize })}
          {badge && <TabBadge count={badge.count} />}
        </TouchableOpacity>
      );
    };

    // ── Render center tab (the elevated circle at the hill peak) ──────────
    const renderCenterTab = () => {
      const { options } = descriptors[centerRoute.key];
      const isFocused = state.index === centerIndex;
      const badge = badges.find((b) => b.route === centerRoute.name);

      const onPress = () => {
        const event = navigation.emit({
          type: 'tabPress',
          target: centerRoute.key,
          canPreventDefault: true,
        });
        if (!isFocused && !event.defaultPrevented) {
          navigation.navigate(centerRoute.name, centerRoute.params);
        }
      };

      // Position the circle below the curve peak so the arc is
      // clearly visible above the icon.
      const circleTop = 8;

      return (
        <Animated.View
          style={[
            styles.centerContainer,
            { top: circleTop },
            centerButtonAnimStyle,
          ]}
        >
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onPressIn={onCenterPressIn}
            onPressOut={onCenterPressOut}
            style={[styles.centerButton, isFocused && styles.centerButtonActive]}
            activeOpacity={0.85}
          >
            {options.tabBarIcon?.({
              focused: isFocused,
              color: '#ffffff',
              size: TAB_BAR_CONFIG.centerIconSize,
            })}
            {badge && <TabBadge count={badge.count} />}
          </TouchableOpacity>
        </Animated.View>
      );
    };

    // ── Build the SVG ─────────────────────────────────────────────────────
    const svgPath = buildCurvedUpPath(barWidth, svgHeight);

    return (
      <Animated.View
        style={[styles.wrapper, { height: wrapperHeight }, animatedContainerStyle]}
        onLayout={onLayout}
        pointerEvents="box-none"
      >
        {/* SVG curved background */}
        <View style={styles.svgContainer}>
          <Svg width={barWidth} height={svgHeight}>
            <Path d={svgPath} fill={Colors.surface} />
          </Svg>
        </View>

        {/* The elevated center button at the hill peak */}
        {renderCenterTab()}

        {/* Side tab icons — positioned in the flat portion of the bar */}
        <View
          style={[
            styles.tabRow,
            {
              top: TAB_BAR_CONFIG.curveRise,
              height: TAB_BAR_CONFIG.barHeight,
            },
          ]}
        >
          <View style={styles.sideGroup}>
            {leftRoutes.map((route) => renderSideTab(route))}
          </View>

          {/* Spacer for the center button area */}
          <View style={{ width: TAB_BAR_CONFIG.curveWidth + 20 }} />

          <View style={styles.sideGroup}>
            {rightRoutes.map((route) => renderSideTab(route))}
          </View>
        </View>
      </Animated.View>
    );
  }
);

CurvedTabBar.displayName = 'CurvedTabBar';
export default CurvedTabBar;

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'visible',
  },

  svgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: TAB_BAR_CONFIG.elevation,
      },
    }),
  },

  tabRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },

  sideGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  sideTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: TAB_BAR_CONFIG.barHeight,
    position: 'relative',
  },

  centerContainer: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 10,
    overflow: 'visible',
  },

  centerButton: {
    width: TAB_BAR_CONFIG.circleSize,
    height: TAB_BAR_CONFIG.circleSize,
    borderRadius: TAB_BAR_CONFIG.circleSize / 2,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    borderColor: Colors.surface,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 14,
      },
    }),
  },

  centerButtonActive: {
    backgroundColor: Colors.primaryLight,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.65,
        shadowRadius: 14,
      },
    }),
  },
});
