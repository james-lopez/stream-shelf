import fixtureShows from '../fixtures/shows.json';
import { RAILS } from '../rails';
import { createFixtureCatalog } from '../service';

// The offline snapshot backs tests and demos; if a refresh breaks its shape, fail here first.
describe('fixture snapshot', () => {
  it('maps every show with a unique id', async () => {
    const shows = await createFixtureCatalog().getShows();
    expect(shows).toHaveLength(fixtureShows.length);
    expect(new Set(shows.map((s) => s.id)).size).toBe(shows.length);
    for (const show of shows) {
      expect(show.name).toBeTruthy();
      expect(show.summary).not.toMatch(/<[^>]+>/);
    }
  });

  it('fills every rail', async () => {
    const shows = await createFixtureCatalog().getShows();
    for (const rail of RAILS) expect(rail.select(shows).length).toBeGreaterThan(0);
  });
});
