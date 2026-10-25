/**
 * @jest-environment jsdom
 */
import { focusIfIdle, installWebFocus } from '../webFocus';

// jsdom has no layout, so each focusable gets a fixed rect. The page mirrors Home:
// a sidebar guide, and a content guide holding two rails of three tiles.
//
//   [Home]    [a1][a2][a3]
//   [MyList]
//             [b1][b2][b3]
function buildPage() {
  document.body.innerHTML = `
    <div id="focus-guide-nav">
      <div tabindex="0" aria-label="Home"></div>
      <div tabindex="0" aria-label="My List"></div>
    </div>
    <div id="focus-guide-content">
      <div id="focus-guide-rail-a">
        <div tabindex="0" aria-label="a1"></div><div tabindex="0" aria-label="a2"></div><div tabindex="0" aria-label="a3"></div>
      </div>
      <div id="focus-guide-rail-b">
        <div tabindex="0" aria-label="b1"></div><div tabindex="0" aria-label="b2"></div><div tabindex="0" aria-label="b3"></div>
      </div>
    </div>`;
  const place = (label: string, left: number, top: number, width = 100, height = 150) => {
    el(label).getBoundingClientRect = () =>
      ({ left, top, right: left + width, bottom: top + height, width, height, x: left, y: top }) as DOMRect;
  };
  place('Home', 0, 0, 80, 40);
  place('My List', 0, 50, 80, 40);
  ['a1', 'a2', 'a3'].forEach((l, i) => place(l, 120 + i * 120, 0));
  ['b1', 'b2', 'b3'].forEach((l, i) => place(l, 120 + i * 120, 200));
}

const el = (label: string) => document.querySelector<HTMLElement>(`[aria-label="${label}"]`)!;
const focused = () => document.activeElement?.getAttribute('aria-label');
const press = (key: string) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  document.dispatchEvent(event);
  return event;
};

let uninstall: () => void;
const onBack = jest.fn();

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  buildPage();
  onBack.mockClear();
  uninstall = installWebFocus({ onBack });
  el('a1').focus();
});

afterEach(() => uninstall());

it('moves along a rail with left/right', () => {
  press('ArrowRight');
  expect(focused()).toBe('a2');
  press('ArrowLeft');
  expect(focused()).toBe('a1');
});

it('leaves the first tile for the sidebar, then walks the sidebar', () => {
  press('ArrowLeft');
  expect(focused()).toBe('Home');
  press('ArrowDown');
  expect(focused()).toBe('My List');
});

it("enters an unvisited rail at its first tile, like TVFocusGuideView autoFocus", () => {
  el('a3').focus();
  press('ArrowDown');
  expect(focused()).toBe('b1');
});

it('returns to the last focused tile when re-entering a rail', () => {
  press('ArrowDown'); // b1
  press('ArrowRight'); // b2
  press('ArrowRight'); // b3
  press('ArrowUp'); // back to rail a, which remembers a1
  expect(focused()).toBe('a1');
  press('ArrowDown');
  expect(focused()).toBe('b3');
});

it('returns from the sidebar to the last focused content tile', () => {
  press('ArrowRight'); // a2
  el('Home').focus();
  press('ArrowRight');
  expect(focused()).toBe('a2');
});

it('does nothing when no target lies in that direction', () => {
  press('ArrowUp');
  expect(focused()).toBe('a1');
});

it('stops arrows from scrolling the page and calls onBack on Escape', () => {
  expect(press('ArrowDown').defaultPrevented).toBe(true);
  expect(press('a').defaultPrevented).toBe(false);
  press('Escape');
  expect(onBack).toHaveBeenCalledTimes(1);
});

it('recovers focus into content when nothing is focused', () => {
  press('ArrowRight'); // a2, remembered by the content guide
  (document.activeElement as HTMLElement).blur();
  press('ArrowDown');
  expect(focused()).toBe('a2');
});

it('focusIfIdle only claims focus when nothing else has it', () => {
  focusIfIdle(el('b2'));
  expect(focused()).toBe('a1');
  (document.activeElement as HTMLElement).blur();
  focusIfIdle(el('b2'));
  expect(focused()).toBe('b2');
});

it('removes its listeners and focus-ring style on uninstall', () => {
  uninstall();
  press('ArrowRight');
  expect(focused()).toBe('a1');
  expect(document.head.querySelector('style')).toBeNull();
  uninstall = () => {};
});
