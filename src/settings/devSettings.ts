import { Platform } from 'react-native';
import { create } from 'zustand';

import type { CatalogConfig } from '../catalog/service';

type DevSettings = CatalogConfig & {
  update: (patch: Partial<CatalogConfig>) => void;
};

const DEFAULTS: CatalogConfig = { source: 'live', latencyMs: 0, failureRate: 0 };

/**
 * On web, `?source=fixtures&latency=2000&fail=0.5` overrides the defaults so states can
 * be demoed by URL and end-to-end tests run against deterministic data.
 */
export function settingsFromQuery(search: string): Partial<CatalogConfig> {
  const params = new URLSearchParams(search);
  const out: Partial<CatalogConfig> = {};
  const source = params.get('source');
  if (source === 'live' || source === 'fixtures') out.source = source;
  const latency = Number(params.get('latency'));
  if (params.has('latency') && latency >= 0) out.latencyMs = latency;
  const fail = Number(params.get('fail'));
  if (params.has('fail') && fail >= 0 && fail <= 1) out.failureRate = fail;
  return out;
}

const initial = Platform.OS === 'web' ? settingsFromQuery(globalThis.location?.search ?? '') : {};

// Not persisted on purpose: a restart should always come back to a healthy catalog.
export const useDevSettings = create<DevSettings>()((set) => ({
  ...DEFAULTS,
  ...initial,
  update: (patch) => set(patch),
}));
