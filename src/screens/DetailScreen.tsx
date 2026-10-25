import { useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCatalog } from '../catalog/CatalogContext';
import { CatalogError, type Show } from '../catalog/types';
import { FocusButton } from '../components/FocusButton';
import { FocusGuide, type FocusGuideHandle } from '../components/FocusGuide';
import { CheckIcon, PlusIcon } from '../components/icons';
import { Poster } from '../components/Poster';
import { SkeletonBlock } from '../components/Skeleton';
import { StateMessage } from '../components/StateMessage';
import { useAsync } from '../hooks/useAsync';
import { useIsInMyList, useMyList, useMyListHydrated } from '../myList/store';
import { colors, useLayout, type Layout } from '../theme';

type Props = {
  id: number;
  onBack: () => void;
};

// Room below the transparent native header on phones; TV and web have no header.
const HANDHELD_HEADER = 44;

export function DetailScreen({ id, onBack }: Props) {
  const catalog = useCatalog();
  const layout = useLayout();
  const insets = useSafeAreaInsets();
  const { status, data, error, retry } = useAsync(() => catalog.getShow(id), [catalog, id]);

  const top = insets.top + layout.overscanY + (layout.tenFoot ? 40 : HANDHELD_HEADER);
  const poster = posterSize(layout);

  let body;
  if (status === 'loading') {
    body = <DetailSkeleton layout={layout} poster={poster} />;
  } else if (status === 'error') {
    const notFound = error instanceof CatalogError && error.kind === 'not_found';
    body = notFound ? (
      <StateMessage
        message="This show isn't available."
        detail="It may have been removed from the catalog."
        action={{ label: 'Go back', onPress: onBack, preferredFocus: true }}
      />
    ) : (
      <StateMessage
        message="Couldn't load this show."
        detail={error.message}
        action={{ label: 'Retry', onPress: retry, preferredFocus: true }}
      />
    );
  } else {
    body = <DetailBody show={data} layout={layout} poster={poster} />;
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: top, paddingBottom: insets.bottom + layout.overscanY + 24, paddingHorizontal: layout.gutter }}
      showsVerticalScrollIndicator={!layout.tenFoot}
    >
      {body}
    </ScrollView>
  );
}

function DetailBody({ show, layout, poster }: { show: Show; layout: Layout; poster: Size }) {
  const meta = metadata(show);
  const title = useRef<FocusGuideHandle>(null);
  return (
    <View style={[styles.body, layout.tenFoot ? styles.row : styles.column, { gap: layout.tenFoot ? 48 : 20 }]}>
      <View style={[styles.poster, poster]}>
        <Poster show={show} quality="original" />
      </View>
      <View style={[styles.info, layout.tenFoot && styles.infoWide]}>
        {/* On TV the title row points at the My List button: it sits level with the sidebar,
            where the poster and title would otherwise leave Right with nowhere to go. */}
        <FocusGuide ref={title} name="detail-title">
          <Text accessibilityRole="header" style={[styles.title, { fontSize: layout.brandSize * 1.1 }]}>
            {show.name}
          </Text>
        </FocusGuide>
        {meta.length ? <Text style={[styles.meta, { fontSize: layout.bodySize }]}>{meta.join('  ·  ')}</Text> : null}
        {show.genres.length ? (
          <View style={styles.genres}>
            {show.genres.map((genre) => (
              <Text key={genre} style={[styles.genre, { fontSize: layout.bodySize * 0.75 }]}>
                {genre}
              </Text>
            ))}
          </View>
        ) : null}
        <MyListToggle show={show} onFocused={(node) => title.current?.remember(node)} />
        <Text style={[styles.summary, { fontSize: layout.bodySize, lineHeight: layout.bodySize * 1.5 }]}>
          {show.summary || 'No description available.'}
        </Text>
      </View>
    </View>
  );
}

function MyListToggle({ show, onFocused }: { show: Show; onFocused: (node: View | null) => void }) {
  const inList = useIsInMyList(show.id);
  const hydrated = useMyListHydrated();
  const { add, remove } = useMyList.getState();

  return (
    <FocusButton
      variant={inList ? 'secondary' : 'primary'}
      label={inList ? 'In My List' : 'Add to My List'}
      icon={(color) => (inList ? <CheckIcon size={22} color={color} /> : <PlusIcon size={22} color={color} />)}
      onPress={() => (inList ? remove(show.id) : add(show))}
      disabled={!hydrated}
      preferredFocus
      onFocused={onFocused}
    />
  );
}

function DetailSkeleton({ layout, poster }: { layout: Layout; poster: Size }) {
  const line = (width: number, height = layout.bodySize) => <SkeletonBlock style={{ width, height }} />;
  return (
    <View
      accessibilityLabel="Loading show"
      style={[styles.body, layout.tenFoot ? styles.row : styles.column, { gap: layout.tenFoot ? 48 : 20 }]}
    >
      <SkeletonBlock style={poster} />
      <View style={[styles.info, layout.tenFoot && styles.infoWide]}>
        {line(layout.brandSize * 8, layout.brandSize * 1.2)}
        {line(layout.bodySize * 16)}
        {line(layout.bodySize * 9, layout.bodySize * 2.4)}
        {line(layout.bodySize * 22)}
        {line(layout.bodySize * 20)}
      </View>
    </View>
  );
}

type Size = { width: number; height: number };

/** Ten-foot shows the poster beside the details; phones stack it above them. */
function posterSize(layout: Layout): Size {
  const width = layout.tenFoot ? 360 : 200;
  return { width, height: Math.round((width * 295) / 210) };
}

/** Year · runtime · rating · network · status, skipping whatever TVMaze left null. */
export function metadata(show: Show): string[] {
  return [
    show.premiered?.slice(0, 4),
    show.runtime ? `${show.runtime} min` : null,
    show.rating !== null ? `★ ${show.rating.toFixed(1)}` : null,
    show.network,
    show.status,
  ].filter((part): part is string => Boolean(part));
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { width: '100%' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  column: { alignItems: 'center' },
  poster: { borderRadius: 12, overflow: 'hidden' },
  info: { gap: 14, width: '100%' },
  infoWide: { flex: 1, maxWidth: 900 },
  title: { color: colors.text, fontWeight: '700' },
  meta: { color: colors.muted },
  genres: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genre: {
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  summary: { color: colors.text, marginTop: 8 },
});
