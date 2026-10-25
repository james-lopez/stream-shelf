import { useEffect, useRef, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Show } from '../catalog/types';
import { focusIfIdle } from '../focus/webFocus';
import { colors, useLayout } from '../theme';

type Props = {
  show: Show;
  onPress: (show: Show) => void;
  hasTVPreferredFocus?: boolean;
};

export function ShowTile({ show, onPress, hasTVPreferredFocus }: Props) {
  const [focused, setFocused] = useState(false);
  const layout = useLayout();
  const ref = useRef<View>(null);

  // hasTVPreferredFocus is a no-op on web, so claim initial focus ourselves.
  useEffect(() => {
    if (Platform.OS === 'web' && hasTVPreferredFocus) focusIfIdle(ref.current);
  }, [hasTVPreferredFocus]);

  return (
    <Pressable
      ref={ref}
      onPress={() => onPress(show)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      hasTVPreferredFocus={hasTVPreferredFocus}
      accessibilityRole="button"
      accessibilityLabel={show.name}
      style={{ width: layout.tile.width }}
    >
      <View
        style={[
          styles.poster,
          layout.tile,
          focused && styles.focused,
          focused && layout.tenFoot && styles.lifted,
        ]}
      >
        {show.image ? (
          <Image source={{ uri: show.image.medium }} style={StyleSheet.absoluteFill} />
        ) : (
          <Text style={styles.fallback}>{show.name}</Text>
        )}
      </View>
      <Text
        numberOfLines={1}
        style={[styles.name, { fontSize: layout.bodySize * 0.8 }, focused && styles.nameFocused]}
      >
        {show.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  poster: {
    borderRadius: 8,
    borderWidth: 3,
    borderColor: 'transparent',
    backgroundColor: colors.surface,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  focused: { borderColor: colors.focus },
  lifted: { transform: [{ scale: 1.08 }] },
  fallback: { color: colors.muted, textAlign: 'center', padding: 8 },
  name: { color: colors.muted, marginTop: 6 },
  nameFocused: { color: colors.text },
});
