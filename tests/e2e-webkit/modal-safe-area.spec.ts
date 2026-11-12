import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';
import { webkit, type Browser, type Page } from 'playwright-core';
import {
  buildModalLayoutFixture,
  installModalLayoutFixture,
  renderModalLayout,
} from './fixtures/modal-layout';

const VIEWPORT = { width: 375, height: 768 };
const INSET = 34;

let browser: Browser;
let fixture: ReturnType<typeof buildModalLayoutFixture>;

beforeAll(async () => {
  fixture = buildModalLayoutFixture();
  browser = await webkit.launch();
});

afterAll(async () => {
  await browser?.close();
});

async function withPage(check: (page: Page) => Promise<void>) {
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  try {
    await installModalLayoutFixture(page, fixture);
    await check(page);
  } finally {
    await page.close();
  }
}

async function pixels(page: Page) {
  // Decode the PNG in the browser rather than adding an image-processing dependency.
  const screenshot = `data:image/png;base64,${(await page.screenshot()).toString('base64')}`;
  const decoded = await page.evaluate(async (source) => {
    const image = new Image();
    image.src = source;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    const raw = context.getImageData(0, 0, image.width, image.height).data;
    const chunks = Array.from({ length: Math.ceil(raw.length / 8192) }, (_, index) => (
      String.fromCharCode(...raw.subarray(index * 8192, (index + 1) * 8192))
    ));
    return { data: btoa(chunks.join('')), width: image.width };
  }, screenshot);
  const data = Buffer.from(decoded.data, 'base64');
  return (x: number, y: number) => {
    const offset = (Math.floor(y) * decoded.width + Math.floor(x)) * 4;
    return Array.from(data.subarray(offset, offset + 3));
  };
}

async function geometry(page: Page) {
  return page.evaluate(() => {
    const rect = (selector: string) => {
      const box = document.querySelector(selector)!.getBoundingClientRect();
      return {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        bottom: box.bottom,
        right: box.right,
      };
    };
    const container = document.querySelector('.modal > .container')!;
    return {
      container: rect('.modal > .container'),
      footer: rect('.fixed-screen-footer'),
      button: rect('.fixed-screen-footer button'),
      background: getComputedStyle(container).backgroundColor,
      shadow: getComputedStyle(container).boxShadow,
    };
  });
}

function rgb(color: string) {
  return color.match(/\d+/g)!.slice(0, 3).map(Number);
}

function expectBackdrop(color: number[]) {
  // 255 × 0.3 = 76.5 can round either way.
  color.forEach((channel) => expect(Math.abs(channel - 77)).toBeLessThanOrEqual(1));
}

describe('iOS modal paint regressions (#3678)', () => {
  it('paints every row of the bottom inset without moving the footer', async () => {
    await withPage(async (page) => {
      await renderModalLayout(page, { inset: 0 });
      const zero = await geometry(page);
      await renderModalLayout(page, { inset: INSET });
      const safe = await geometry(page);

      expect(safe.container.bottom).toBe(VIEWPORT.height - INSET);
      expect(safe.footer.height).toBe(zero.footer.height);
      expect(safe.container.bottom - safe.button.bottom)
        .toBeCloseTo(zero.container.bottom - zero.button.bottom, 1);

      const pixel = await pixels(page);
      const expected = rgb(safe.background);
      const rows = Array.from({ length: INSET }, (_, offset) => safe.container.bottom + offset);
      rows.forEach((y) => {
        // Include the first row: a border seam would otherwise go unnoticed.
        expect(pixel(8, y)).toEqual(expected);
        expect(pixel(VIEWPORT.width / 2, y)).toEqual(expected);
        expect(pixel(VIEWPORT.width - 9, y)).toEqual(expected);
      });
    });
  });

  it('keeps the transparent lock-screen variant transparent below the container', async () => {
    await withPage(async (page) => {
      await renderModalLayout(page, { transparent: true, inset: INSET });
      const { background, shadow } = await geometry(page);
      expect(background).toBe('rgba(0, 0, 0, 0)');
      expect(shadow).toBe('none');
      const pixel = await pixels(page);
      // White page through the modal's 70% black backdrop.
      expectBackdrop(pixel(VIEWPORT.width / 2, VIEWPORT.height - 1));
    });
  });

  it('preserves the ordinary bottom-sheet shadow when the safe-area value changes', async () => {
    await withPage(async (page) => {
      await renderModalLayout(page, { fullScreen: false, fromBottom: true, inset: 0 });
      const zero = await geometry(page);
      await renderModalLayout(page, { fullScreen: false, fromBottom: true, inset: INSET });
      const safe = await geometry(page);
      expect(safe).toEqual(zero);

      // Expose the space below the sheet, as during its slide transition. A
      // misplaced fill rule on all from-bottom modals would paint this region.
      await page.locator('.modal > .container').evaluate((element: HTMLElement) => {
        element.style.setProperty('transform', 'translateY(-80px)');
      });
      const moved = await geometry(page);
      const pixel = await pixels(page);
      expectBackdrop(pixel(VIEWPORT.width / 2, moved.container.bottom + 30));
    });
  });

  it('moves a full-screen bottom-sheet fill together with its container', async () => {
    await withPage(async (page) => {
      await renderModalLayout(page, { fromBottom: true, inset: INSET });
      const settled = await geometry(page);
      const settledPixel = await pixels(page);
      expect(settledPixel(VIEWPORT.width / 2, VIEWPORT.height - 1))
        .toEqual(rgb(settled.background));

      await page.locator('.modal > .container').evaluate((element: HTMLElement) => {
        element.style.setProperty('transform', 'translateY(-80px)');
      });
      const moved = await geometry(page);
      expect(moved.container.bottom).toBe(settled.container.bottom - 80);
      const pixel = await pixels(page);
      expect(pixel(VIEWPORT.width / 2, moved.container.bottom + INSET - 2))
        .toEqual(rgb(moved.background));
      expectBackdrop(pixel(VIEWPORT.width / 2, moved.container.bottom + INSET + 20));
    });
  });
});
