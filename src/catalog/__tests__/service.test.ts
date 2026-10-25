import { createFixtureCatalog, createLiveCatalog, withSimulation } from '../service';
import { stripHtml, toShow, type TvMazeShow } from '../tvmaze';
import { CatalogError, type CatalogService } from '../types';

const raw = (overrides: Partial<TvMazeShow> = {}): TvMazeShow => ({
  id: 1,
  name: 'Show',
  language: 'English',
  genres: ['Drama'],
  status: 'Ended',
  runtime: null,
  averageRuntime: 45,
  premiered: '2020-01-01',
  rating: { average: 7.5 },
  weight: 90,
  network: null,
  webChannel: { name: 'Netflix' },
  image: null,
  summary: '<p><b>Bold</b> &amp; plain</p>',
  ...overrides,
});

describe('toShow', () => {
  it('flattens TVMaze fields and strips summary HTML', () => {
    expect(toShow(raw())).toMatchObject({
      rating: 7.5,
      runtime: 45,
      network: 'Netflix',
      summary: 'Bold & plain',
    });
  });

  it('strips tags and decodes entities', () => {
    expect(stripHtml('<p>Tom &amp; Jerry&#39;s</p>')).toBe("Tom & Jerry's");
  });
});

describe('createFixtureCatalog', () => {
  const catalog = createFixtureCatalog([raw({ id: 1 }), raw({ id: 2 })]);

  it('returns a show by id', async () => {
    await expect(catalog.getShow(2)).resolves.toMatchObject({ id: 2 });
  });

  it('rejects unknown ids as not_found', async () => {
    await expect(catalog.getShow(99)).rejects.toMatchObject({ kind: 'not_found' });
  });
});

describe('createLiveCatalog', () => {
  const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as Response;

  it('shares one request across concurrent getShows calls', async () => {
    const fetchMock = jest.fn().mockResolvedValue(ok([raw()]));
    const catalog = createLiveCatalog(fetchMock);

    await Promise.all([catalog.getShows(), catalog.getShows(), catalog.getShows()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not cache a failure, so a retry refetches', async () => {
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new TypeError('Network request failed'))
      .mockResolvedValueOnce(ok([raw()]));
    const catalog = createLiveCatalog(fetchMock);

    await expect(catalog.getShows()).rejects.toMatchObject({ kind: 'network' });
    await expect(catalog.getShows()).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('maps a 404 to not_found', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: false, status: 404 } as Response);
    await expect(createLiveCatalog(fetchMock).getShow(5)).rejects.toMatchObject({ kind: 'not_found' });
  });
});

describe('withSimulation', () => {
  const base: CatalogService = createFixtureCatalog([raw()]);

  it('fails when the roll is under failureRate, then succeeds on retry', async () => {
    const rolls = [0.1, 0.9];
    const catalog = withSimulation(base, { latencyMs: 0, failureRate: 0.5, random: () => rolls.shift()! });

    await expect(catalog.getShows()).rejects.toBeInstanceOf(CatalogError);
    await expect(catalog.getShows()).resolves.toHaveLength(1);
  });

  it('delays by latencyMs', async () => {
    jest.useFakeTimers();
    const catalog = withSimulation(base, { latencyMs: 1000, failureRate: 0 });
    const onDone = jest.fn();

    const pending = catalog.getShows().then(onDone);
    await jest.advanceTimersByTimeAsync(999);
    expect(onDone).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    await pending;
    expect(onDone).toHaveBeenCalled();

    jest.useRealTimers();
  });
});
