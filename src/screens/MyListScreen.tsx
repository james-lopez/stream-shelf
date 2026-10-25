import { useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ShowSummary } from '../catalog/types';
import { FocusGuide, type FocusGuideHandle } from '../components/FocusGuide';
import { ShowTile } from '../components/ShowTile';
import { SkeletonTiles } from '../components/Skeleton';
import { StateMessage } from '../components/StateMessage';
import { useMyList, useMyListHydrated } from '../myList/store';
import { colors, useLayout } from '../theme';

type Props = {
  onSelectShow: (show: ShowSummary) => void;
  onBrowse: () => void;
};

export function MyListScreen({ onSelectShow, onBrowse }: Props) {
  const layout = useLayout();
  const insets = useSafeAreaInsets();
  const hydrated = useMyListHydrated();
  const items = useMyList((state) => state.items);
  const guide = useRef<FocusGuideHandle>(null);

  let body;
  if (!hydrated) {
    body = <SkeletonTiles count={4} label="Loading My List" />;
  } else if (items.length === 0) {
    body = (
      <StateMessage
        message="Your list is empty."
        detail="Add shows from their detail page and they'll appear here."
        action={{ label: 'Browse shows', onPress: onBrowse, preferredFocus: true }}
      />
    );
  } else {
    // A wrapping grid rather than a virtualised list: lists stay small, and the TV focus
    // engine (and our web layer) navigate a plain 2D layout naturally.
    body = (
      <FocusGuide ref={guide} name="my-list" style={[styles.grid, { gap: layout.gap }]}>
        {items.map((item, i) => (
          <ShowTile
            key={item.id}
            show={item}
            onPress={onSelectShow}
            hasTVPreferredFocus={i === 0}
            onFocused={(node) => guide.current?.remember(node)}
          />
        ))}
      </FocusGuide>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + layout.overscanY + 16,
        paddingBottom: layout.overscanY + 24,
        paddingHorizontal: layout.gutter,
      }}
      showsVerticalScrollIndicator={!layout.tenFoot}
    >
      <Text accessibilityRole="header" style={[styles.title, { fontSize: layout.titleSize }]}>
        My List{hydrated && items.length ? <Text style={styles.count}>{`  ${items.length}`}</Text> : null}
      </Text>
      {body}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  title: { color: colors.text, fontWeight: '600', marginBottom: 16 },
  count: { color: colors.muted, fontWeight: '400' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 12 },
});
