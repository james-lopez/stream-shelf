import type { Show } from './types';

export type Rail = {
  id: string;
  title: string | ((shows: Show[]) => string);
  select: (shows: Show[]) => Show[];
};

const RAIL_SIZE = 20;

const topBy = (shows: Show[], score: (s: Show) => number) =>
  [...shows].sort((a, b) => score(b) - score(a)).slice(0, RAIL_SIZE);

export function mostCommonGenre(shows: Show[]): string | null {
  const counts = new Map<string, number>();
  for (const show of shows) {
    for (const genre of show.genres) counts.set(genre, (counts.get(genre) ?? 0) + 1);
  }
  let best: string | null = null;
  for (const [genre, count] of counts) {
    if (best === null || count > counts.get(best)!) best = genre;
  }
  return best;
}

// Adding a rail is one entry here; Home renders whatever this array contains.
export const RAILS: Rail[] = [
  { id: 'trending', title: 'Trending', select: (shows) => topBy(shows, (s) => s.weight) },
  {
    id: 'top-rated',
    title: 'Top Rated',
    select: (shows) => topBy(shows.filter((s) => s.rating !== null), (s) => s.rating!),
  },
  {
    id: 'genre',
    title: (shows) => mostCommonGenre(shows) ?? 'By Genre',
    select: (shows) => {
      const genre = mostCommonGenre(shows);
      return genre ? shows.filter((s) => s.genres.includes(genre)).slice(0, RAIL_SIZE) : [];
    },
  },
];

export const railTitle = (rail: Rail, shows: Show[]) =>
  typeof rail.title === 'string' ? rail.title : rail.title(shows);
