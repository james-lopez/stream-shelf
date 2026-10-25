import { useMemo, useRef } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { useCatalog } from '../catalog/CatalogContext';
import { railTitle, type Rail } from '../catalog/rails';
import type { ShowSummary } from '../catalog/types';
import { useAsync } from '../hooks/useAsync';
import { colors, useLayout } from '../theme';
import { FocusGuide, type FocusGuideHandle } from './FocusGuide';
import { ShowTile } from './ShowTile';
import { SkeletonBlock, SkeletonTiles } from './Skeleton';
import { StateMessage } from './StateMessage';

type Props = {
  rail: Rail;
  onSelect: (show: ShowSummary) => void;
  /** Give the first tile initial TV focus; only one rail on screen should set this. */
  preferredFocus?: boolean;
  /** Called with each tile's view as it gains focus (the row also remembers it itself). */
  onTileFocused?: (node: View | null) => void;
};

// Each rail fetches on its own so one failing rail doesn't blank the others.
export function RailRow({ rail, onSelect, preferredFocus, onTileFocused }: Props) {
  const catalog = useCatalog();
  const layout = useLayout();
  const { status, data, error, retry } = useAsync(() => catalog.getShows(), [catalog]);
  const guide = useRef<FocusGuideHandle>(null);

  const items = useMemo(() => (data ? rail.select(data) : []), [data, rail]);
  // A data-derived title is unknown while loading; after a failure use the rail's own fallback.
  const title =
    status === 'loading' && typeof rail.title !== 'string' ? '' : railTitle(rail, data ?? []);

  let body;
  if (status === 'loading') {
    body = <SkeletonTiles label={`Loading ${title || 'rail'}`} />;
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
          <ShowTile
            show={item}
            onPress={onSelect}
            hasTVPreferredFocus={preferredFocus && index === 0}
            onFocused={(node) => {
              guide.current?.remember(node);
              onTileFocused?.(node);
            }}
          />
        )}
        showsHorizontalScrollIndicator={!layout.tenFoot}
        contentContainerStyle={{ gap: layout.gap, paddingHorizontal: layout.gutter, paddingVertical: 12 }}
      />
    );
  }

  return (
    <View style={styles.rail}>
      {title ? (
        <Text
          accessibilityRole="header"
          style={[styles.title, { fontSize: layout.titleSize, paddingHorizontal: layout.gutter }]}
        >
          {title}
        </Text>
      ) : (
        // Data-derived titles (e.g. the genre rail) are unknown until shows arrive.
        <SkeletonTitle />
      )}
      {status === 'success' && items.length > 0 ? (
        <FocusGuide ref={guide} name={`rail-${rail.id}`}>
          {body}
        </FocusGuide>
      ) : (
        <View style={{ paddingHorizontal: layout.gutter }}>{body}</View>
      )}
    </View>
  );
}

function SkeletonTitle() {
  const layout = useLayout();
  return (
    <View style={{ paddingHorizontal: layout.gutter }}>
      <SkeletonBlock
        testID="rail-title-loading"
        style={{ width: layout.titleSize * 6, height: layout.titleSize * 1.1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { marginBottom: 16 },
  title: { color: colors.text, fontWeight: '600' },
});
