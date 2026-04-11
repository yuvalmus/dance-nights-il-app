import { Colors } from '@/constants/colors';
import { useState, useRef, useCallback, ReactElement } from 'react';
import {
  View,
  StyleSheet,
  ColorValue,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { AnimatedDot } from './AnimatedDot';

type DotConfig = {
  color: ColorValue;
};

type Props<T> = {
  data: T[];
  renderItem: (item: T, index: number) => ReactElement;
  dots?: DotConfig[];
};

export default function PagingCarousel<T>({
  data,
  renderItem,
  dots,
}: Props<T>) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideWidth, setSlideWidth] = useState(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setSlideWidth(e.nativeEvent.layout.width);
  }, []);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (slideWidth <= 0) return;
      const offset = e.nativeEvent.contentOffset.x;
      const index = Math.round(offset / slideWidth);
      setActiveIndex(index);
    },
    [slideWidth],
  );

  if (data.length === 0) return null;

  return (
    <View onLayout={onLayout}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={slideWidth}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        nestedScrollEnabled
        style={styles.rtlScroll}
      >
        {data.map((item, i) => (
          <View key={i} style={[styles.rtlSlide, { width: slideWidth }]}>
            {renderItem(item, i)}
          </View>
        ))}
      </ScrollView>

      {dots && dots.length > 1 && (
        <View style={styles.dots}>
          {dots.map((dot, i) => {
            const isActive = i === activeIndex;
            return (
              <AnimatedDot
                key={i}
                isActive={isActive}
                color={dot.color}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rtlScroll: {
    transform: [{ scaleX: -1 }],
  },
  rtlSlide: {
    transform: [{ scaleX: -1 }],
  },
  dots: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  dot: {
    borderRadius: 5,
  },
  dotActive: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: Colors.overlay
  },
  dotInactive: {
    width: 7,
    height: 7,
  },
});
