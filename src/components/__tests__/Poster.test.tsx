import { fireEvent, render, screen } from '@testing-library/react-native';

import { makeShow } from '../../../test/factories';
import { Poster } from '../Poster';

const withImage = makeShow({ name: 'Firefly', image: { medium: 'https://img.test/m.jpg', original: 'https://img.test/o.jpg' } });

it('shows a loading placeholder until the artwork loads', async () => {
  await render(<Poster show={withImage} />);
  expect(screen.getByTestId('poster-loading')).toBeTruthy();

  await fireEvent(screen.getByTestId('poster-image'), 'load');

  expect(screen.queryByTestId('poster-loading')).toBeNull();
  expect(screen.getByTestId('poster-image')).toBeTruthy();
});

it('falls back to the title when the artwork fails to load', async () => {
  await render(<Poster show={withImage} />);

  await fireEvent(screen.getByTestId('poster-image'), 'error');

  expect(screen.getByTestId('poster-missing')).toBeTruthy();
  expect(screen.getByText('Firefly')).toBeTruthy();
  expect(screen.queryByTestId('poster-image')).toBeNull();
});

it('shows the fallback straight away when a show has no artwork', async () => {
  await render(<Poster show={makeShow({ name: 'Untitled Pilot', image: null })} />);

  expect(screen.getByTestId('poster-missing')).toBeTruthy();
  expect(screen.getByText('Untitled Pilot')).toBeTruthy();
  expect(screen.queryByTestId('poster-loading')).toBeNull();
});
