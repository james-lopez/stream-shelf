import { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import type { ShowSummary } from '../catalog/types';
import { USE_NATIVE_DRIVER, usePulse } from '../hooks/usePulse';
import { colors } from '../theme';
import { LogoMark } from './Brand';

type Status = 'loading' | 'loaded' | 'failed';

/**
 * Show artwork with explicit states: a pulsing placeholder while the image loads, a
 * branded fallback with the title when there's no image or it fails, and a fade-in once ready.
 */
export function Poster({ show, quality = 'medium' }: { show: ShowSummary; quality?: 'medium' | 'original' }) {
  const [status, setStatus] = useState<Status>(show.image ? 'loading' : 'failed');
  const opacity = useRef(new Animated.Value(0)).current;

  const onLoad = () => {
    setStatus('loaded');
    Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: USE_NATIVE_DRIVER }).start();
  };

  return (
    <View style={styles.frame}>
      {status === 'loading' ? <LoadingPlaceholder /> : null}
      {status === 'failed' ? <MissingArtwork name={show.name} /> : null}
      {show.image && status !== 'failed' ? (
        <Animated.Image
          testID="poster-image"
          source={{ uri: show.image[quality] }}
          onLoad={onLoad}
          onError={() => setStatus('failed')}
          style={[StyleSheet.absoluteFill, { opacity }]}
        />
      ) : null}
    </View>
  );
}

function LoadingPlaceholder() {
  const opacity = usePulse();
  return (
    <Animated.View testID="poster-loading" style={[styles.placeholder, { opacity }]}>
      <View style={styles.dimMark}>
        <LogoMark size={22} />
      </View>
    </Animated.View>
  );
}

function MissingArtwork({ name }: { name: string }) {
  return (
    <View testID="poster-missing" style={styles.placeholder}>
      <View style={styles.dimMark}>
        <LogoMark size={22} />
      </View>
      <Text numberOfLines={3} style={styles.missingName}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, backgroundColor: colors.surface },
  placeholder: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: colors.surface,
  },
  dimMark: { opacity: 0.35 },
  missingName: { color: colors.muted, textAlign: 'center', fontSize: 13 },
});
