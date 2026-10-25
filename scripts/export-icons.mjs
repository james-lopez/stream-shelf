// Renders app icons and the favicon from assets/brand/mark.json. Run: npm run icons
// macOS-only: rasterises SVG with Quick Look (qlmanage) and resizes with ImageMagick (magick).
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const mark = JSON.parse(readFileSync(join(root, 'assets/brand/mark.json'), 'utf8'));
const [vx, vy, vw] = mark.viewBox;

const tileGradient = `
  <radialGradient id="tile" cx="30%" cy="22%" r="95%">
    <stop offset="0" stop-color="#26262f"/><stop offset="0.55" stop-color="#0b0b0f"/><stop offset="1" stop-color="#000"/>
  </radialGradient>`;

const ribbonDefs = `
  <linearGradient id="brand" gradientUnits="userSpaceOnUse"
    x1="${mark.gradient.from[0]}" y1="${mark.gradient.from[1]}" x2="${mark.gradient.to[0]}" y2="${mark.gradient.to[1]}">
    ${mark.gradient.colors.map((c, i, all) => `<stop offset="${i / (all.length - 1)}" stop-color="${c}"/>`).join('')}
  </linearGradient>
  <clipPath id="ends"><path clip-rule="evenodd" d="${mark.clip}"/></clipPath>`;

/** The ribbon scaled to `width` (in a 1024 canvas) and centred. */
function ribbon(width, stroke = 'url(#brand)', strokeWidth = mark.strokeWidth) {
  const scale = width / vw;
  const height = mark.viewBox[3] * scale;
  const tx = (1024 - width) / 2;
  const ty = (1024 - height) / 2;
  return `<g transform="translate(${tx} ${ty}) scale(${scale}) translate(${-vx} ${-vy})">
    <path d="${mark.ribbon}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="none" clip-path="url(#ends)"/>
  </g>`;
}

const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><defs>${tileGradient}${ribbonDefs}</defs>${body}</svg>`;

const work = mkdtempSync(join(tmpdir(), 'stream-shelf-icons-'));

/** Quick Look always paints a white backdrop, so transparent art goes through `transparent()`. */
function render(name, body) {
  const src = join(work, `${name}.svg`);
  writeFileSync(src, svg(body));
  execFileSync('qlmanage', ['-t', '-s', '1024', '-o', work, src], { stdio: 'ignore' });
  return `${src}.png`;
}

/**
 * Alpha comes from a black-on-white render of the ribbon; colour from a render with a
 * fattened stroke, so edge pixels carry true gradient colour instead of a white fringe.
 */
function transparent(name, width, colour) {
  const mask = render(`${name}-mask`, ribbon(width, '#000'));
  const fill = colour ? null : render(`${name}-fill`, ribbon(width, 'url(#brand)', mark.strokeWidth + 40));
  const out = join(work, `${name}.png`);
  execFileSync('magick', [
    ...(fill ? [fill] : ['-size', '1024x1024', `xc:${colour}`]),
    '(', mask, '-colorspace', 'gray', '-negate', ')',
    '-alpha', 'off', '-compose', 'CopyOpacity', '-composite', out,
  ]);
  return out;
}

const tile = (rx = 0) => `<rect width="1024" height="1024" rx="${rx}" fill="url(#tile)"/>`;

// Android adaptive icons mask to a 66/108 safe circle; a 1.64:1 ribbon 520 wide fits inside it.
const icons = [
  { out: 'favicon.png', size: 196, src: () => render('favicon', tile(224) + ribbon(800)) },
  // iOS rounds the corners itself and rejects alpha, so this one is full-bleed and flattened.
  { out: 'icon.png', size: 1024, flatten: true, src: () => render('ios', tile() + ribbon(800)) },
  { out: 'android-icon-background.png', size: 512, src: () => render('android-bg', tile()) },
  { out: 'android-icon-foreground.png', size: 512, src: () => transparent('android-fg', 520) },
  { out: 'android-icon-monochrome.png', size: 432, src: () => transparent('android-mono', 520, '#fff') },
];

for (const icon of icons) {
  const args = [icon.src(), '-resize', `${icon.size}x${icon.size}`];
  if (icon.flatten) args.push('-background', '#000', '-alpha', 'remove', '-alpha', 'off');
  execFileSync('magick', [...args, join(root, 'assets', icon.out)]);
  console.log(`assets/${icon.out} (${icon.size}px)`);
}
