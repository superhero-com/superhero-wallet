import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../../..');

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
