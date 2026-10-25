import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { CatalogContext } from '../src/catalog/CatalogContext';
import { CatalogError, type CatalogService, type Show } from '../src/catalog/types';

/** A promise the test settles by hand, for asserting in-between (loading) states. */
export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** CatalogService backed by jest mocks; defaults to an empty catalog. */
export function fakeCatalog(overrides: Partial<CatalogService> = {}) {
  return {
    getShows: jest.fn<Promise<Show[]>, []>(async () => []),
    getShow: jest.fn<Promise<Show>, [number]>(async () => {
      throw new CatalogError('Show not found', 'not_found');
    }),
    ...overrides,
  } satisfies CatalogService;
}

/** Renders `ui` with a catalog in context, the way screens receive it in the app. */
export function renderWithCatalog(ui: ReactElement, catalog: CatalogService = fakeCatalog()) {
  return render(<CatalogContext.Provider value={catalog}>{ui}</CatalogContext.Provider>);
}
