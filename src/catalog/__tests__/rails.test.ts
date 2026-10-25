import { makeShow } from '../../../test/factories';
import { mostCommonGenre, RAILS, railTitle } from '../rails';
import type { Show } from '../types';

const rail = (id: string) => RAILS.find((r) => r.id === id)!;
const ids = (shows: Show[]) => shows.map((s) => s.id);

const shows = [
  makeShow({ id: 1, weight: 50, rating: 9, genres: ['Comedy'] }),
  makeShow({ id: 2, weight: 99, rating: null, genres: ['Drama'] }),
  makeShow({ id: 3, weight: 70, rating: 6, genres: ['Drama', 'Comedy'] }),
  makeShow({ id: 4, weight: 10, rating: 8, genres: ['Drama'] }),
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

it('genre rail falls back to a generic title with no data', () => {
  expect(railTitle(rail('genre'), [])).toBe('By Genre');
});

it('every rail is empty for an empty catalog', () => {
  for (const r of RAILS) expect(r.select([])).toEqual([]);
});

it('caps rails at 20 shows', () => {
  const many = Array.from({ length: 30 }, (_, i) => makeShow({ weight: i, rating: i, genres: ['Drama'] }));
  for (const r of RAILS) expect(r.select(many)).toHaveLength(20);
});
