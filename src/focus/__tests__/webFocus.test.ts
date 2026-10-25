/**
 * @jest-environment jsdom
 */
import { installWebFocus, takePreferredFocus } from '../webFocus';

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

it('enters the nearest rail at its own memory, not the last content tile (as on tvOS)', () => {
  press('ArrowRight'); // a2: rail a remembers it
  press('ArrowDown'); // b1
  press('ArrowRight'); // b2: last content tile overall
  el('Home').focus(); // sidebar item level with rail a
  press('ArrowRight');
  expect(focused()).toBe('a2');
});

it('returns from the sidebar to the rail tile it left', () => {
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

describe('takePreferredFocus', () => {
  // Wrap the rails in a "home" screen and add a "detail" screen beside them.
  beforeEach(() => {
    // Move (not re-create) the rails so their stubbed rects survive.
    const content = document.getElementById('focus-guide-content')!;
    const home = document.createElement('div');
    home.id = 'focus-guide-screen-home';
    home.append(...content.children);
    content.append(home);
    content.insertAdjacentHTML(
      'beforeend',
      '<div id="focus-guide-screen-detail"><div tabindex="0" aria-label="Add to My List"></div></div>',
    );
    el('a1').focus();
  });

  it('takes focus when nothing has it', () => {
    (document.activeElement as HTMLElement).blur();
    takePreferredFocus(el('b2'));
    expect(focused()).toBe('b2');
  });

  it('does not steal focus within the same screen', () => {
    takePreferredFocus(el('b2'));
    expect(focused()).toBe('a1');
  });

  it('takes focus from a tile left behind on the previous screen', () => {
    takePreferredFocus(el('Add to My List'));
    expect(focused()).toBe('Add to My List');
  });

  it('never steals focus from the sidebar', () => {
    el('My List').focus();
    takePreferredFocus(el('Add to My List'));
    expect(focused()).toBe('My List');
  });
});

it('restores focus to the previous element after Back', () => {
  jest.useFakeTimers();
  press('ArrowRight'); // a2
  const detail = document.createElement('div');
  detail.tabIndex = 0;
  detail.getBoundingClientRect = () => ({ left: 0, top: 0, right: 10, bottom: 10, width: 10, height: 10 }) as DOMRect;
  document.body.appendChild(detail);
  detail.focus();

  press('Escape'); // the app pops the screen, removing its focused element
  detail.remove();
  jest.advanceTimersByTime(100);

  expect(onBack).toHaveBeenCalled();
  expect(focused()).toBe('a2');
  jest.useRealTimers();
});

it('removes its listeners and focus-ring style on uninstall', () => {
  uninstall();
  press('ArrowRight');
  expect(focused()).toBe('a1');
  expect(document.head.querySelector('style')).toBeNull();
  uninstall = () => {};
});
