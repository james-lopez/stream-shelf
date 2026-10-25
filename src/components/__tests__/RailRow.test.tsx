import { act, fireEvent, screen } from '@testing-library/react-native';

import { deferred, fakeCatalog, renderWithCatalog } from '../../../test/catalog';
import { makeShow } from '../../../test/factories';
import type { Rail } from '../../catalog/rails';
import { CatalogError, type Show } from '../../catalog/types';
import { RailRow } from '../RailRow';

const everything: Rail = { id: 'all', title: 'Everything', select: (shows) => shows };
const firefly = makeShow({ name: 'Firefly' });

const renderRail = (catalog: ReturnType<typeof fakeCatalog>, rail = everything) =>
  renderWithCatalog(<RailRow rail={rail} onSelect={jest.fn()} />, catalog);

it('shows skeleton tiles until shows arrive', async () => {
  const shows = deferred<Show[]>();
  await renderRail(fakeCatalog({ getShows: () => shows.promise }));

  expect(screen.getByLabelText('Loading Everything')).toBeTruthy();

  await act(async () => shows.resolve([firefly]));

  expect(await screen.findByRole('button', { name: 'Firefly' })).toBeTruthy();
  expect(screen.queryByLabelText('Loading Everything')).toBeNull();
});

it('shows a title skeleton for data-derived titles, then the real title', async () => {
  const shows = deferred<Show[]>();
  const byFirstName: Rail = { id: 'dyn', title: (s) => (s[0] ? `More like ${s[0].name}` : 'Picks'), select: (s) => s };
  await renderRail(fakeCatalog({ getShows: () => shows.promise }), byFirstName);

  expect(screen.getByTestId('rail-title-loading')).toBeTruthy();

  await act(async () => shows.resolve([firefly]));

  expect(await screen.findByText('More like Firefly')).toBeTruthy();
  expect(screen.queryByTestId('rail-title-loading')).toBeNull();
});

it('shows an empty state when the rail selects nothing', async () => {
  await renderRail(fakeCatalog({ getShows: async () => [firefly] }), { ...everything, select: () => [] });

  expect(await screen.findByText('Nothing here yet.')).toBeTruthy();
});

it('shows an error with a retry that refetches', async () => {
  const getShows = jest
    .fn<Promise<Show[]>, []>()
    .mockRejectedValueOnce(new CatalogError('Simulated failure', 'simulated'))
    .mockResolvedValueOnce([firefly]);
  await renderRail(fakeCatalog({ getShows }));

  expect(await screen.findByText("Couldn't load Everything.")).toBeTruthy();
  expect(screen.getByText('Simulated failure')).toBeTruthy();

  await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));

  expect(await screen.findByRole('button', { name: 'Firefly' })).toBeTruthy();
  expect(getShows).toHaveBeenCalledTimes(2);
});

it('uses the fallback title when a data-derived rail fails', async () => {
  const dynamic: Rail = { id: 'dyn', title: (s) => (s.length ? 'Drama' : 'By Genre'), select: (s) => s };
  await renderRail(fakeCatalog({ getShows: async () => Promise.reject(new Error('offline')) }), dynamic);

  expect(await screen.findByText("Couldn't load By Genre.")).toBeTruthy();
  expect(screen.queryByTestId('rail-title-loading')).toBeNull();
});
