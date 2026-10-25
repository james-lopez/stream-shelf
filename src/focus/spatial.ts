export type Direction = 'up' | 'down' | 'left' | 'right';

export type Rect = { left: number; top: number; right: number; bottom: number };

// Off-axis misalignment costs more than distance, so "down" prefers the tile directly
// below over a nearer one off to the side.
const OFF_AXIS_WEIGHT = 2;

/**
 * Index of the candidate the TV focus engine would most plausibly pick when moving
 * `direction` from `from`, or -1 if nothing lies that way.
 */
export function findNext(from: Rect, candidates: Rect[], direction: Direction): number {
  let best = -1;
  let bestScore = Infinity;
  candidates.forEach((rect, i) => {
    const s = score(from, rect, direction);
    if (s < bestScore) {
      best = i;
      bestScore = s;
    }
  });
  return best;
}

function score(a: Rect, b: Rect, direction: Direction): number {
  const horizontal = direction === 'left' || direction === 'right';

  // Gap along the direction of travel. Centers must advance, which tolerates the
  // slight overlap a scaled-up focused tile causes.
  const gap = {
    right: b.left - a.right,
    left: a.left - b.right,
    down: b.top - a.bottom,
    up: a.top - b.bottom,
  }[direction];
  const ahead = {
    right: center(b, 'x') > center(a, 'x'),
    left: center(b, 'x') < center(a, 'x'),
    down: center(b, 'y') > center(a, 'y'),
    up: center(b, 'y') < center(a, 'y'),
  }[direction];
  if (!ahead) return Infinity;
  // Up/down stays within the column you're in; only left/right may cross to the sidebar.
  if (!horizontal && (b.right <= a.left || b.left >= a.right)) return Infinity;

  const axis = horizontal ? 'y' : 'x';
  const offAxis = Math.abs(center(a, axis) - center(b, axis));
  return Math.max(gap, 0) + offAxis * OFF_AXIS_WEIGHT;
}

function center(r: Rect, axis: 'x' | 'y') {
  return axis === 'x' ? (r.left + r.right) / 2 : (r.top + r.bottom) / 2;
}
