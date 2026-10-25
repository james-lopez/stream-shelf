import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RAILS } from '../catalog/rails';
import type { ShowSummary } from '../catalog/types';
import { Brand } from '../components/Brand';
import { RailRow } from '../components/RailRow';
import { colors, useLayout } from '../theme';

type Props = {
  onSelectShow: (show: ShowSummary) => void;
};

export function HomeScreen({ onSelectShow }: Props) {
  const layout = useLayout();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + layout.overscanY, paddingBottom: layout.overscanY }}
      showsVerticalScrollIndicator={!layout.tenFoot}
    >
      <View style={styles.brand}>
        <Brand size={layout.brandSize} />
      </View>
      {RAILS.map((rail, i) => (
        <RailRow key={rail.id} rail={rail} onSelect={onSelectShow} preferredFocus={i === 0} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  brand: { alignItems: 'center', marginTop: 12, marginBottom: 20 },
});
