import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StateMessage } from '../components/StateMessage';
import { colors, useLayout } from '../theme';

// Placeholder until the persisted My List store lands with the detail screen.
export function MyListScreen() {
  const layout = useLayout();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + layout.overscanY + 16, paddingHorizontal: layout.gutter }]}>
      <Text accessibilityRole="header" style={[styles.title, { fontSize: layout.titleSize }]}>
        My List
      </Text>
      <StateMessage message="Your list is empty." detail="Add shows from their detail page and they'll appear here." />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  title: { color: colors.text, fontWeight: '600', marginBottom: 8 },
});
