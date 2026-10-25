import { create } from 'zustand';

import type { CatalogConfig } from '../catalog/service';

type DevSettings = CatalogConfig & {
  update: (patch: Partial<CatalogConfig>) => void;
};

// Not persisted on purpose: a restart should always come back to a healthy catalog.
export const useDevSettings = create<DevSettings>()((set) => ({
  source: 'live',
  latencyMs: 0,
  failureRate: 0,
  update: (patch) => set(patch),
}));
