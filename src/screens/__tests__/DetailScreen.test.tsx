import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, screen } from '@testing-library/react-native';

import { deferred, fakeCatalog, renderWithCatalog } from '../../../test/catalog';
import { makeShow } from '../../../test/factories';
import { CatalogError, type Show } from '../../catalog/types';
import { useMyList } from '../../myList/store';
import { DetailScreen, metadata } from '../DetailScreen';

const firefly = makeShow({
  id: 1,
  name: 'Firefly',
  genres: ['Drama', 'Science-Fiction'],
  premiered: '2002-09-20',
  runtime: 60,
  rating: 9,
  network: 'FOX',
  status: 'Ended',
  summary: 'Five hundred years in the future…',
});

const renderDetail = (getShow: (id: number) => Promise<Show>, onBack = jest.fn()) =>
  renderWithCatalog(<DetailScreen id={1} onBack={onBack} />, fakeCatalog({ getShow: jest.fn(getShow) }));

beforeEach(async () => {
  await AsyncStorage.clear();
  useMyList.setState({ items: [] });
});

it('shows a skeleton while loading, then artwork, metadata and description', async () => {
  const show = deferred<Show>();
  await renderDetail(() => show.promise);
  expect(screen.getByLabelText('Loading show')).toBeTruthy();

  await act(async () => show.resolve(firefly));

  expect(screen.getByRole('header', { name: 'Firefly' })).toBeTruthy();
  expect(screen.getByText('2002  ·  60 min  ·  ★ 9.0  ·  FOX  ·  Ended')).toBeTruthy();
  expect(screen.getByText('Science-Fiction')).toBeTruthy();
  expect(screen.getByText('Five hundred years in the future…')).toBeTruthy();
  expect(screen.getByTestId('poster-missing')).toBeTruthy(); // no artwork on this show
});

it('skips missing metadata and says when there is no description', async () => {
  await renderDetail(async () => makeShow({ name: 'Bare', status: 'Running', summary: '' }));

  expect(await screen.findByText('Running')).toBeTruthy();
  expect(screen.getByText('No description available.')).toBeTruthy();
});

it('offers a retry when loading fails', async () => {
  const getShow = jest
    .fn<Promise<Show>, [number]>()
    .mockRejectedValueOnce(new CatalogError('Could not reach TVMaze', 'network'))
    .mockResolvedValueOnce(firefly);
  await renderDetail(getShow);

  expect(await screen.findByText("Couldn't load this show.")).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));

  expect(await screen.findByRole('header', { name: 'Firefly' })).toBeTruthy();
});

it('offers a way back when the show no longer exists', async () => {
  const onBack = jest.fn();
  await renderDetail(async () => Promise.reject(new CatalogError('Show not found', 'not_found')), onBack);

  expect(await screen.findByText("This show isn't available.")).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
  expect(onBack).toHaveBeenCalled();
});

it('toggles the show in and out of My List', async () => {
  await renderDetail(async () => firefly);

  await fireEvent.press(await screen.findByRole('button', { name: 'Add to My List', disabled: false }));
  expect(screen.getByRole('button', { name: 'In My List' })).toBeTruthy();
  expect(useMyList.getState().items.map((i) => i.id)).toEqual([1]);

  await fireEvent.press(screen.getByRole('button', { name: 'In My List' }));
  expect(screen.getByRole('button', { name: 'Add to My List' })).toBeTruthy();
  expect(useMyList.getState().items).toEqual([]);
});

it('builds metadata from whatever fields are present', () => {
  expect(metadata(makeShow({ premiered: '2013-06-24', rating: 6.6, status: 'Ended' }))).toEqual(['2013', '★ 6.6', 'Ended']);
});
