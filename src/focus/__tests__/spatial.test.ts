import { findNext, type Rect } from '../spatial';

const box = (left: number, top: number, w = 100, h = 150): Rect => ({ left, top, right: left + w, bottom: top + h });

// Two rails of tiles plus a sidebar item on the far left.
const sidebar = box(0, 0, 60, 40);
const railA = [box(100, 0), box(220, 0), box(340, 0)];
const railB = [box(100, 200), box(220, 200), box(340, 200)];
const all = [sidebar, ...railA, ...railB];

const pick = (from: Rect, dir: Parameters<typeof findNext>[2]) => {
  const others = all.filter((r) => r !== from);
  const i = findNext(from, others, dir);
  return i < 0 ? null : others[i];
};

it('moves right to the adjacent tile in the same rail', () => {
  expect(pick(railA[0], 'right')).toBe(railA[1]);
});

it('moves down to the tile directly below, not the nearest one diagonally', () => {
  expect(pick(railA[2], 'down')).toBe(railB[2]);
});

it('moves left out of the first tile into the sidebar', () => {
  expect(pick(railA[0], 'left')).toBe(sidebar);
});

it('does not jump up to the sidebar from the top rail', () => {
  expect(pick(railA[1], 'up')).toBeNull();
});

it('returns nothing when no candidate lies in that direction', () => {
  expect(pick(railA[1], 'up')).toBeNull();
  expect(pick(railB[2], 'right')).toBeNull();
});

it('tolerates a scaled-up focused tile overlapping its neighbour', () => {
  const lifted = { left: 92, top: -6, right: 208, bottom: 156 }; // railA[0] at 1.08x
  expect(pick(lifted, 'right')).toBe(railA[1]);
});
