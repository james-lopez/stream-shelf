import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { usePulse } from '../hooks/usePulse';
import { colors, useLayout } from '../theme';

/** A row of pulsing tile placeholders sharing one animation. */
export function SkeletonTiles({ count = 6, label }: { count?: number; label: string }) {
  const layout = useLayout();
  const opacity = usePulse();
  return (
    <View style={[styles.row, { gap: layout.gap }]} accessibilityLabel={label}>
      {Array.from({ length: count }, (_, i) => (
        <Animated.View key={i} style={[styles.block, layout.tile, { opacity }]} />
      ))}
    </View>
  );
}

/** Pulsing bars standing in for text, e.g. a title or metadata line. */
export function SkeletonBlock({ style, testID }: { style: StyleProp<ViewStyle>; testID?: string }) {
  const opacity = usePulse();
  return <Animated.View testID={testID} style={[styles.block, style, { opacity }]} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: 12, overflow: 'hidden' },
  block: { borderRadius: 8, backgroundColor: colors.surface },
});
