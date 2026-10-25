import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ShowSummary } from '../catalog/types';
import { takePreferredFocus } from '../focus/webFocus';
import { colors, useLayout } from '../theme';
import { Poster } from './Poster';

type Props = {
  show: ShowSummary;
  onPress: (show: ShowSummary) => void;
  hasTVPreferredFocus?: boolean;
};

export function ShowTile({ show, onPress, hasTVPreferredFocus }: Props) {
  const [focused, setFocused] = useState(false);
  const layout = useLayout();
  const ref = useRef<View>(null);

  // hasTVPreferredFocus is a no-op on web, so claim initial focus ourselves.
  useEffect(() => {
    if (Platform.OS === 'web' && hasTVPreferredFocus) takePreferredFocus(ref.current);
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
        <Poster show={show} />
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
    overflow: 'hidden',
  },
  focused: { borderColor: colors.focus },
  lifted: { transform: [{ scale: 1.08 }] },
  name: { color: colors.muted, marginTop: 6 },
  nameFocused: { color: colors.text },
});
