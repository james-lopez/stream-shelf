import AsyncStorage from '@react-native-async-storage/async-storage';

import { makeShow } from '../../../test/factories';
import { useMyList } from '../store';

const KEY = 'stream-shelf/my-list';
const firefly = makeShow({ id: 1, name: 'Firefly', genres: ['Sci-Fi'], summary: 'Long text' });
const wire = makeShow({ id: 2, name: 'The Wire' });
const ids = () => useMyList.getState().items.map((item) => item.id);

beforeEach(async () => {
  await AsyncStorage.clear();
  useMyList.setState({ items: [] });
});

it('adds a show as a summary snapshot, newest first', () => {
  useMyList.getState().add(firefly);
  useMyList.getState().add(wire);

  expect(ids()).toEqual([2, 1]);
  expect(useMyList.getState().items[1]).toEqual({ id: 1, name: 'Firefly', image: null, addedAt: expect.any(Number) });
});

it('ignores adding a show that is already in the list', () => {
  useMyList.getState().add(firefly);
  useMyList.getState().add(firefly);
  expect(ids()).toEqual([1]);
});

it('removes a show by id', () => {
  useMyList.getState().add(firefly);
  useMyList.getState().add(wire);
  useMyList.getState().remove(1);
  expect(ids()).toEqual([2]);
});

it('persists the list to async-storage', async () => {
  useMyList.getState().add(firefly);

  const stored = JSON.parse((await AsyncStorage.getItem(KEY))!);
  expect(stored.state.items.map((item: { id: number }) => item.id)).toEqual([1]);
  expect(stored.state.add).toBeUndefined(); // actions aren't persisted
});

it('hydrates a previously saved list, as after an app restart', async () => {
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify({ version: 1, state: { items: [{ id: 2, name: 'The Wire', image: null, addedAt: 1 }] } }),
  );

  await useMyList.persist.rehydrate();

  expect(ids()).toEqual([2]);
  expect(useMyList.persist.hasHydrated()).toBe(true);
});
