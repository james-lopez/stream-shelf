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

const HISTORY_SIZE = 20;
const RESTORE_ATTEMPTS = 20;
const RESTORE_INTERVAL_MS = 50;

export function installWebFocus({ onBack }: { onBack: () => void }): () => void {
  const memory = new Map<string, HTMLElement>();
  // Recent focus, newest last, so Back can return to where the user came from.
  const history: HTMLElement[] = [];
  let restoreTimer: ReturnType<typeof setTimeout> | undefined;

  const style = document.createElement('style');
  style.textContent = `${FOCUSABLE}:focus { outline: none; }`;
  document.head.appendChild(style);

  const onFocusIn = (event: FocusEvent) => {
    const target = event.target as HTMLElement;
    for (const guide of guidesOf(target)) memory.set(guide.id, target);
    history.push(target);
    if (history.length > HISTORY_SIZE) history.shift();
  };

  // The previous screen becomes visible over a short transition, so retry for a moment.
  const restoreAfterBack = (attempt = 0) => {
    if (!isIdle(document.activeElement)) return;
    const previous = [...history].reverse().find((el) => el.isConnected && isVisible(el));
    if (previous) return moveFocus(previous);
    if (attempt < RESTORE_ATTEMPTS) restoreTimer = setTimeout(() => restoreAfterBack(attempt + 1), RESTORE_INTERVAL_MS);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onBack();
      restoreTimer = setTimeout(restoreAfterBack, RESTORE_INTERVAL_MS);
      return;
    }
    const direction = KEYS[event.key];
    if (!direction) return;
    event.preventDefault(); // arrows would otherwise scroll the page

    const current = document.activeElement;
    if (!(current instanceof HTMLElement) || isIdle(current)) {
      const remembered = memory.get(`${FOCUS_GUIDE_PREFIX}content`);
      const fallback = remembered && isVisible(remembered) ? remembered : visibleFocusables(document)[0];
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
    clearTimeout(restoreTimer);
    document.removeEventListener('focusin', onFocusIn);
    document.removeEventListener('keydown', onKeyDown);
    style.remove();
  };
}

/**
 * Web stand-in for hasTVPreferredFocus. Takes focus when nothing usable has it, or when
 * focus was left on another screen (e.g. the tile that opened this one). It never steals
 * focus from the same screen or from the sidebar.
 */
export function takePreferredFocus(el: unknown) {
  if (!(el instanceof HTMLElement)) return;
  const active = document.activeElement;
  const elsewhere = active instanceof HTMLElement && screenOf(active) !== null && screenOf(active) !== screenOf(el);
  if (isIdle(active) || elsewhere) el.focus({ preventScroll: true }); // keep the brand in view on first load
}

function isIdle(el: Element | null): boolean {
  return !(el instanceof HTMLElement) || el === document.body || !el.isConnected || !isVisible(el);
}

function screenOf(el: HTMLElement): HTMLElement | null {
  return el.closest<HTMLElement>(`[id^="${FOCUS_GUIDE_PREFIX}screen-"]`);
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
