import { render, screen } from '@testing-library/react-native';

import App from '../App';
import { useDevSettings } from '../src/settings/devSettings';

it('renders the home rails from fixtures', async () => {
  useDevSettings.setState({ source: 'fixtures', latencyMs: 0, failureRate: 0 });
  await render(<App />);

  expect(await screen.findByText('Trending')).toBeTruthy();
  expect(screen.getByText('Top Rated')).toBeTruthy();
  expect(screen.getByText('Drama')).toBeTruthy();
});
