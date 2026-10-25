import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { CatalogContext } from '../../catalog/CatalogContext';
import type { Rail } from '../../catalog/rails';
import { CatalogError, type CatalogService, type Show } from '../../catalog/types';
import { RailRow } from '../RailRow';

const show = (id: number, name: string): Show => ({
  id,
  name,
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
});

const everything: Rail = { id: 'all', title: 'Everything', select: (shows) => shows };

function renderRail(getShows: CatalogService['getShows'], rail = everything) {
  const catalog: CatalogService = { getShows, getShow: jest.fn() };
  return render(
    <CatalogContext.Provider value={catalog}>
      <RailRow rail={rail} onSelect={jest.fn()} />
    </CatalogContext.Provider>,
  );
}

it('shows a loading placeholder until shows arrive', async () => {
  let resolve!: (shows: Show[]) => void;
  await renderRail(() => new Promise((r) => (resolve = r)));

  expect(screen.getByLabelText('Loading Everything')).toBeTruthy();

  await act(async () => resolve([show(1, 'Firefly')]));
  expect(await screen.findByRole('button', { name: 'Firefly' })).toBeTruthy();
  expect(screen.queryByLabelText('Loading Everything')).toBeNull();
});

it('shows an empty state when the rail selects nothing', async () => {
  await renderRail(async () => [show(1, 'Firefly')], { ...everything, select: () => [] });

  expect(await screen.findByText('Nothing here yet.')).toBeTruthy();
});

it('shows an error with a retry that refetches', async () => {
  const getShows = jest
    .fn<Promise<Show[]>, []>()
    .mockRejectedValueOnce(new CatalogError('Simulated failure', 'simulated'))
    .mockResolvedValueOnce([show(1, 'Firefly')]);
  await renderRail(getShows);

  expect(await screen.findByText("Couldn't load Everything.")).toBeTruthy();
  expect(screen.getByText('Simulated failure')).toBeTruthy();

  await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));

  expect(await screen.findByRole('button', { name: 'Firefly' })).toBeTruthy();
  expect(getShows).toHaveBeenCalledTimes(2);
});
