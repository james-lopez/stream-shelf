import { useRef } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RAILS } from '../catalog/rails';
import type { ShowSummary } from '../catalog/types';
import { Brand } from '../components/Brand';
import { FocusGuide, type FocusGuideHandle } from '../components/FocusGuide';
import { RailRow } from '../components/RailRow';
import { colors, useLayout } from '../theme';

type Props = {
  onSelectShow: (show: ShowSummary) => void;
};

export function HomeScreen({ onSelectShow }: Props) {
  const layout = useLayout();
  const insets = useSafeAreaInsets();
  const header = useRef<FocusGuideHandle>(null);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + layout.overscanY, paddingBottom: layout.overscanY }}
      showsVerticalScrollIndicator={!layout.tenFoot}
    >
      {/* On TV the header row is a focus guide pointing at the first rail's remembered tile:
          it sits level with the sidebar's Home item, which otherwise has nothing to its right. */}
      <FocusGuide ref={header} name="home-header" style={styles.brand}>
        <Brand size={layout.brandSize} />
      </FocusGuide>
      {RAILS.map((rail, i) => (
        <RailRow
          key={rail.id}
          rail={rail}
          onSelect={onSelectShow}
          preferredFocus={i === 0}
          onTileFocused={i === 0 ? (node) => header.current?.remember(node) : undefined}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  brand: { alignItems: 'center', marginTop: 12, marginBottom: 20 },
});
