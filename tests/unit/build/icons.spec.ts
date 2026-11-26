import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../../..');
const manifest = JSON.parse(readFileSync(path.join(root, 'src/manifest.json'), 'utf-8'));

const iconSets: [string, Record<string, string>][] = [
  ['icons', manifest.icons],
  ['action', manifest.action.default_icon],
  ['sidebar_action', manifest.sidebar_action.default_icon],
];

const icons = iconSets.flatMap(([key, set]) => Object.entries(set)
  .map(([size, file]) => ({ key, size: Number(size), file })));

/** Width and height from the PNG's IHDR chunk, which follows the 8-byte signature. */
function readPngSize(file: string) {
  const png = readFileSync(file);
  return [png.readUInt32BE(16), png.readUInt32BE(20)];
}

describe('index.html icon links', () => {
  it('point at files of their declared size', () => {
    const html = readFileSync(path.join(root, 'index.html'), 'utf-8');
    const links = Array.from(new DOMParser().parseFromString(html, 'text/html')
      .querySelectorAll('link[rel~="icon"]'));

    expect(links).not.toHaveLength(0);
    links.forEach((link) => {
      const href = link.getAttribute('href')!;
      const file = path.join(root, 'public', href);
      const sizes = link.getAttribute('sizes');
      expect(existsSync(file), href).toBe(true);
      if (sizes) {
        expect(readPngSize(file), href).toEqual(sizes.split('x').map(Number));
      }
    });
  });
});

describe('manifest icons', () => {
  // vite.config.mts copies public/favicons/favicon-<size>.png to icons/icon_<size>.png.
  it.each(icons)('$key $size is a file of that size', ({ size, file }) => {
    expect(file).toBe(`icons/icon_${size}.png`);
    expect(readPngSize(path.join(root, `public/favicons/favicon-${size}.png`)))
      .toEqual([size, size]);
  });

  // Firefox asks for 64px in its extensions panel on 2x screens, and Chrome for 48px
  // at 3x. A set without a large icon gets scaled up there.
  it.each(iconSets)('%s has an icon of 64px or more', (_, set) => {
    expect(Math.max(...Object.keys(set).map(Number))).toBeGreaterThanOrEqual(64);
  });
});
