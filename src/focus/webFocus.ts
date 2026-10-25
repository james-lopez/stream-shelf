/**
 * Web-only keyboard layer that SIMULATES the tvOS/Android TV focus engine so arrow keys
 * behave like a remote. Native TV builds never load this; they use the platform engine.
 *
 * - Arrow keys move DOM focus to the nearest focusable in that direction (see spatial.ts).
 * - FocusGuide regions mimic TVFocusGuideView autoFocus: entering one restores its
 *   last-focused child, or its first child on the first visit.
 * - Components draw focus via their own onFocus/onBlur, so the browser ring is hidden.
 */
import { findNext, type Direction } from './spatial';

export const FOCUS_GUIDE_PREFIX = 'focus-guide-';

const KEYS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};
const FOCUSABLE = '[tabindex="0"]';
const GUIDE = `[id^="${FOCUS_GUIDE_PREFIX}"]`;

export function installWebFocus({ onBack }: { onBack: () => void }): () => void {
  const memory = new Map<string, HTMLElement>();

  const style = document.createElement('style');
  style.textContent = `${FOCUSABLE}:focus { outline: none; }`;
  document.head.appendChild(style);

  const onFocusIn = (event: FocusEvent) => {
    const target = event.target as HTMLElement;
    for (const guide of guidesOf(target)) memory.set(guide.id, target);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') return onBack();
    const direction = KEYS[event.key];
    if (!direction) return;
    event.preventDefault(); // arrows would otherwise scroll the page

    const current = document.activeElement;
    if (!(current instanceof HTMLElement) || current === document.body) {
      const fallback = memory.get(`${FOCUS_GUIDE_PREFIX}content`) ?? visibleFocusables(document)[0];
      return moveFocus(fallback);
    }

    const others = visibleFocusables(document).filter((el) => el !== current);
    const index = findNext(
      current.getBoundingClientRect(),
      others.map((el) => el.getBoundingClientRect()),
      direction,
    );
    if (index >= 0) moveFocus(enterGuide(others[index], current, memory));
  };

  document.addEventListener('focusin', onFocusIn);
  document.addEventListener('keydown', onKeyDown);
  return () => {
    document.removeEventListener('focusin', onFocusIn);
    document.removeEventListener('keydown', onKeyDown);
    style.remove();
  };
}

/** Web stand-in for hasTVPreferredFocus: take focus only if nothing else has it. */
export function focusIfIdle(el: unknown) {
  if (el instanceof HTMLElement && (!document.activeElement || document.activeElement === document.body)) {
    el.focus({ preventScroll: true }); // keep the brand in view on first load
  }
}

function moveFocus(el: HTMLElement | undefined) {
  if (!el) return;
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
}

/** If moving into a guide from outside, redirect to what that guide remembers. */
function enterGuide(candidate: HTMLElement, current: HTMLElement, memory: Map<string, HTMLElement>) {
  for (const guide of guidesOf(candidate)) {
    if (guide.contains(current)) continue;
    const remembered = memory.get(guide.id);
    if (remembered && guide.contains(remembered) && isVisible(remembered)) return remembered;
    return visibleFocusables(guide)[0] ?? candidate;
  }
  return candidate;
}

/** Guide ancestors of `el`, outermost first. */
function guidesOf(el: HTMLElement): HTMLElement[] {
  const guides: HTMLElement[] = [];
  let guide = el.parentElement?.closest<HTMLElement>(GUIDE);
  while (guide) {
    guides.unshift(guide);
    guide = guide.parentElement?.closest<HTMLElement>(GUIDE);
  }
  return guides;
}

function visibleFocusables(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(isVisible);
}

// Inactive stack screens stay mounted but hidden; zero-size rects filter them out.
function isVisible(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}
