import { mostCommonGenre, RAILS, railTitle } from '../rails';
import type { Show } from '../types';

const show = (id: number, overrides: Partial<Show> = {}): Show => ({
  id,
  name: `Show ${id}`,
  genres: [],
  rating: null,
  weight: 0,
  premiered: null,
  runtime: null,
  language: null,
  status: 'Running',
  network: null,
  summary: '',
  image: null,
  ...overrides,
});

const rail = (id: string) => RAILS.find((r) => r.id === id)!;
const ids = (shows: Show[]) => shows.map((s) => s.id);

const shows = [
  show(1, { weight: 50, rating: 9, genres: ['Comedy'] }),
  show(2, { weight: 99, rating: null, genres: ['Drama'] }),
  show(3, { weight: 70, rating: 6, genres: ['Drama', 'Comedy'] }),
  show(4, { weight: 10, rating: 8, genres: ['Drama'] }),
];

it('trending orders by weight', () => {
  expect(ids(rail('trending').select(shows))).toEqual([2, 3, 1, 4]);
});

it('top rated orders by rating and drops unrated shows', () => {
  expect(ids(rail('top-rated').select(shows))).toEqual([1, 4, 3]);
});

it('genre rail uses the most common genre for its title and contents', () => {
  expect(mostCommonGenre(shows)).toBe('Drama');
  expect(railTitle(rail('genre'), shows)).toBe('Drama');
  expect(ids(rail('genre').select(shows))).toEqual([2, 3, 4]);
});

it('every rail is empty for an empty catalog', () => {
  for (const r of RAILS) expect(r.select([])).toEqual([]);
});
