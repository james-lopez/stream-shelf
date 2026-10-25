import { Platform, useWindowDimensions } from 'react-native';

import mark from '../assets/brand/mark.json';

export const colors = {
  background: '#0b0b0f',
  surface: '#1c1c24',
  text: '#ffffff',
  muted: '#9a9aa8',
  accent: '#8b5cf6',
  focus: '#ffffff',
};

/** Logo gradient, teal → blue → purple. */
export const brandGradient = mark.gradient.colors;

export const fonts = { brand: 'Exo2_600SemiBold' };

const HANDHELD = {
  tenFoot: false,
  gutter: 16,
  overscanY: 0,
  tile: { width: 120, height: 178 },
  gap: 10,
  titleSize: 18,
  bodySize: 15,
  brandSize: 24,
};

// TV-safe overscan is ~5% of a 1920x1080 frame; tiles match TVMaze's 210x295 "medium" art.
const TEN_FOOT = {
  tenFoot: true,
  gutter: 80,
  overscanY: 48,
  tile: { width: 210, height: 295 },
  gap: 24,
  titleSize: 30,
  bodySize: 24,
  brandSize: 40,
};

export type Layout = typeof HANDHELD;

/** Ten-foot sizing on TV, and on wide web where keyboard arrows stand in for the remote. */
export function useLayout(): Layout {
  const { width } = useWindowDimensions();
  return Platform.isTV || (Platform.OS === 'web' && width >= 1280) ? TEN_FOOT : HANDHELD;
}
