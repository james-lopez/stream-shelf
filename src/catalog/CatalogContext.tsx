import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { useDevSettings } from '../settings/devSettings';
import { createCatalog } from './service';
import type { CatalogService } from './types';

export const CatalogContext = createContext<CatalogService | null>(null);

/** Rebuilds the catalog when dev settings change; screens refetch because the instance changes. */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const source = useDevSettings((s) => s.source);
  const latencyMs = useDevSettings((s) => s.latencyMs);
  const failureRate = useDevSettings((s) => s.failureRate);

  const catalog = useMemo(
    () => createCatalog({ source, latencyMs, failureRate }),
    [source, latencyMs, failureRate],
  );
  return <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogService {
  const catalog = useContext(CatalogContext);
  if (!catalog) throw new Error('useCatalog must be used inside CatalogProvider');
  return catalog;
}
