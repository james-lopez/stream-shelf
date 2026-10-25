import type { TvMazeShow } from '../src/catalog/tvmaze';
import type { Show } from '../src/catalog/types';

let nextId = 1000;

/** A minimal valid Show; override only what the test cares about. */
export function makeShow(overrides: Partial<Show> = {}): Show {
  const id = overrides.id ?? nextId++;
  return {
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
  };
}

/** A raw TVMaze payload as the API (and fixtures) return it. */
export function makeTvMazeShow(overrides: Partial<TvMazeShow> = {}): TvMazeShow {
  const id = overrides.id ?? nextId++;
  return {
    id,
    name: `Show ${id}`,
    language: 'English',
    genres: ['Drama'],
    status: 'Ended',
    runtime: 60,
    averageRuntime: 60,
    premiered: '2020-01-01',
    rating: { average: 7.5 },
    weight: 90,
    network: { name: 'HBO' },
    webChannel: null,
    image: { medium: `https://img.test/${id}-m.jpg`, original: `https://img.test/${id}-o.jpg` },
    summary: '<p>Summary</p>',
    ...overrides,
  };
}
