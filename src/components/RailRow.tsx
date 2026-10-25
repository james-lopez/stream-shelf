import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { useCatalog } from '../catalog/CatalogContext';
import { railTitle, type Rail } from '../catalog/rails';
import type { Show } from '../catalog/types';
import { useAsync } from '../hooks/useAsync';
import { colors, useLayout } from '../theme';
import { FocusGuide } from './FocusGuide';
import { ShowTile } from './ShowTile';
import { StateMessage } from './StateMessage';

type Props = {
  rail: Rail;
  onSelect: (show: Show) => void;
  /** Give the first tile initial TV focus; only one rail on screen should set this. */
  preferredFocus?: boolean;
};

const SKELETON_COUNT = 6;

// Each rail fetches on its own so one failing rail doesn't blank the others.
export function RailRow({ rail, onSelect, preferredFocus }: Props) {
  const catalog = useCatalog();
  const layout = useLayout();
  const { status, data, error, retry } = useAsync(() => catalog.getShows(), [catalog]);

  const items = useMemo(() => (data ? rail.select(data) : []), [data, rail]);
  const title = data ? railTitle(rail, data) : typeof rail.title === 'string' ? rail.title : '';

  let body;
  if (status === 'loading') {
    body = (
      <View style={[styles.row, { gap: layout.gap }]} accessibilityLabel={`Loading ${title || 'rail'}`}>
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <View key={i} style={[styles.skeleton, layout.tile]} />
        ))}
      </View>
    );
  } else if (status === 'error') {
    body = (
      <StateMessage
        message={`Couldn't load ${title || 'this rail'}.`}
        detail={error.message}
        action={{ label: 'Retry', onPress: retry }}
      />
    );
  } else if (items.length === 0) {
    body = <StateMessage message="Nothing here yet." />;
  } else {
    body = (
      <FlatList
        horizontal
        data={items}
        keyExtractor={(show) => String(show.id)}
        renderItem={({ item, index }) => (
          <ShowTile show={item} onPress={onSelect} hasTVPreferredFocus={preferredFocus && index === 0} />
        )}
        showsHorizontalScrollIndicator={!layout.tenFoot}
        contentContainerStyle={{ gap: layout.gap, paddingHorizontal: layout.gutter, paddingVertical: 12 }}
      />
    );
  }

  return (
    <View style={styles.rail}>
      <Text
        accessibilityRole="header"
        style={[styles.title, { fontSize: layout.titleSize, paddingHorizontal: layout.gutter }]}
      >
        {title || ' '}
      </Text>
      {status === 'success' && items.length > 0 ? (
        <FocusGuide name={`rail-${rail.id}`}>{body}</FocusGuide>
      ) : (
        <View style={{ paddingHorizontal: layout.gutter }}>{body}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { marginBottom: 16 },
  title: { color: colors.text, fontWeight: '600' },
  row: { flexDirection: 'row', paddingVertical: 12, overflow: 'hidden' },
  skeleton: { borderRadius: 8, backgroundColor: colors.surface },
});
