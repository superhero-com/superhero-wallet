import type { Page } from 'playwright-core';

/** Drags from the screen's left edge until Ionic starts moving the pages, and holds. */
export async function startEdgeDrag(page: Page, entering: string, leaving: string) {
  await page.waitForFunction((selector) => document.querySelector(selector)
    ?.closest<HTMLElement & { swipeGesture?: boolean }>('ion-router-outlet')
    ?.swipeGesture === true, leaving);
  // Ionic shares the same gesture recognizer for mouse and touch.
  await page.mouse.move(1, 400);
  await page.mouse.down();
  await page.mouse.move(80, 400, { steps: 8 });
  // The progress animation must initialize before the drag ends.
  await page.waitForSelector(`${entering}:not(.ion-page-hidden)`, { state: 'attached' });
  await page.waitForFunction((selector) => document.querySelector(selector)
    ?.getAnimations({ subtree: true }).some((animation) => animation.playState === 'paused'), leaving);
}

/** Swipes back from the leaving page to the entering one. */
export async function swipeBack(page: Page, entering: string, leaving: string) {
  await startEdgeDrag(page, entering, leaving);
  await page.mouse.move(370, 400, { steps: 20 });
  await page.mouse.up();
  await page.waitForSelector(leaving, { state: 'detached' });
}
