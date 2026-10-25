import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, within } from '@testing-library/react-native';

import App from '../App';
import { useMyList } from '../src/myList/store';
import { useDevSettings } from '../src/settings/devSettings';

beforeEach(async () => {
  useDevSettings.setState({ source: 'fixtures', latencyMs: 0, failureRate: 0 });
  await AsyncStorage.clear();
  useMyList.setState({ items: [] });
});

it('renders the home rails from fixtures', async () => {
  await render(<App />);

  expect(await screen.findByText('Trending')).toBeTruthy();
  expect(screen.getByText('Top Rated')).toBeTruthy();
  expect(screen.getByText('Drama')).toBeTruthy();
});

it('adding a show on its detail page puts it in My List', async () => {
  await render(<App />);

  const firstTrending = (await screen.findAllByRole('button', { name: 'Under the Dome' }))[0];
  await fireEvent.press(firstTrending);
  await fireEvent.press(await screen.findByRole('button', { name: 'Add to My List', disabled: false }));
  expect(await screen.findByRole('button', { name: 'In My List' })).toBeTruthy();

  await fireEvent.press(screen.getByRole('tab', { name: 'My List' }));

  const header = await screen.findByRole('header', { name: /My List\s+1/ });
  expect(header).toBeTruthy();
  expect(screen.queryByText('Your list is empty.')).toBeNull();
  const myListScreen = header.parent!;
  expect(within(myListScreen).getByRole('button', { name: 'Under the Dome' })).toBeTruthy();
});
