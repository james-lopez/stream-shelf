import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';

// react-native-web has no native animation driver and warns if asked for one.
export const USE_NATIVE_DRIVER = Platform.OS !== 'web';

/**
 * Opacity value that breathes between dim and full. One pulse per group of placeholders
 * keeps them in sync and avoids running an animation per tile.
 */
export function usePulse(): Animated.Value {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const step = (toValue: number) =>
      Animated.timing(opacity, {
        toValue,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: USE_NATIVE_DRIVER,
      });
    const loop = Animated.loop(Animated.sequence([step(1), step(0.45)]));
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return opacity;
}
