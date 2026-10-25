import fixtureShows from './fixtures/shows.json';
import { toShow, type TvMazeShow } from './tvmaze';
import { CatalogError, type CatalogService, type Show } from './types';

const TVMAZE = 'https://api.tvmaze.com';

export function createLiveCatalog(fetchImpl: typeof fetch = fetch): CatalogService {
  // Every rail asks for the full list; share one request so "hit the endpoint once" holds.
  let shows: Promise<Show[]> | null = null;

  async function getJson<T>(path: string): Promise<T> {
    let res: Response;
    try {
      res = await fetchImpl(`${TVMAZE}${path}`);
    } catch {
      throw new CatalogError('Could not reach TVMaze', 'network');
    }
    if (res.status === 404) throw new CatalogError('Show not found', 'not_found');
    if (!res.ok) throw new CatalogError(`TVMaze responded ${res.status}`, 'network');
    return res.json() as Promise<T>;
  }

  return {
    getShows() {
      shows ??= getJson<TvMazeShow[]>('/shows?page=0')
        .then((raw) => raw.map(toShow))
        .catch((error) => {
          shows = null; // don't cache failures, so retry refetches
          throw error;
        });
      return shows;
    },
    async getShow(id) {
      return toShow(await getJson<TvMazeShow>(`/shows/${id}`));
    },
  };
}

export function createFixtureCatalog(raw: TvMazeShow[] = fixtureShows as TvMazeShow[]): CatalogService {
  const shows = raw.map(toShow);
  return {
    async getShows() {
      return shows;
    },
    async getShow(id) {
      const show = shows.find((s) => s.id === id);
      if (!show) throw new CatalogError('Show not found', 'not_found');
      return show;
    },
  };
}

export type Simulation = {
  latencyMs: number;
  /** 0–1 probability that any single call fails. */
  failureRate: number;
  random?: () => number;
};

/** Decorates any CatalogService with artificial latency and failures so loading/error UI can be demoed. */
export function withSimulation(
  service: CatalogService,
  { latencyMs, failureRate, random = Math.random }: Simulation,
): CatalogService {
  async function simulate<T>(call: () => Promise<T>): Promise<T> {
    if (latencyMs > 0) await new Promise((r) => setTimeout(r, latencyMs));
    if (random() < failureRate) throw new CatalogError('Simulated failure', 'simulated');
    return call();
  }
  return {
    getShows: () => simulate(() => service.getShows()),
    getShow: (id) => simulate(() => service.getShow(id)),
  };
}

export type CatalogConfig = Simulation & { source: 'live' | 'fixtures' };

export function createCatalog({ source, ...simulation }: CatalogConfig): CatalogService {
  const base = source === 'live' ? createLiveCatalog() : createFixtureCatalog();
  return withSimulation(base, simulation);
}
