import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { resolveScrollableElementWithRetry } from '@/composables/viewport';

/**
 * Stands in for an ion-content on a page that was just opened: until it renders,
 * it has no scroll part and the browser computes no styles for it.
 */
function createIonContent({ hostOverflow, ionOverflow }: {
  hostOverflow: string;
  ionOverflow: string;
}) {
  // A document without a window keeps Ionic from upgrading the element
  const doc = document.implementation.createHTMLDocument();
  const ionContent = doc.createElement('ion-content');
  ionContent.attachShadow({ mode: 'open' });
  doc.body.appendChild(ionContent);
  const partScroll = doc.createElement('div');
  partScroll.setAttribute('part', 'scroll');

  let isRendered = false;
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => {
    const overflowY = (element === ionContent) ? hostOverflow : 'auto';
    return {
      overflowY: isRendered ? overflowY : '',
      getPropertyValue: () => (isRendered ? ionOverflow : ''),
    } as unknown as CSSStyleDeclaration;
  });

  return {
    ionContent,
    partScroll,
    render() {
      ionContent.shadowRoot!.appendChild(partScroll);
      isRendered = true;
    },
  };
}

describe('resolveScrollableElementWithRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('waits for the ion-content to render however many frames it takes', () => {
    const { ionContent, partScroll, render } = createIonContent({
      hostOverflow: 'hidden',
      ionOverflow: 'auto',
    });
    const onResolved = vi.fn();

    resolveScrollableElementWithRetry(ionContent, onResolved);
    for (let frame = 0; frame < 30; frame += 1) {
      vi.advanceTimersToNextFrame();
    }
    expect(onResolved).toHaveBeenLastCalledWith(ionContent);

    render();
    vi.advanceTimersToNextFrame();

    expect(onResolved).toHaveBeenLastCalledWith(partScroll);
  });

  it('settles on the host when the host scrolls itself', () => {
    const { ionContent, render } = createIonContent({
      hostOverflow: 'auto',
      ionOverflow: 'hidden',
    });
    const onResolved = vi.fn();

    resolveScrollableElementWithRetry(ionContent, onResolved);
    render();
    vi.advanceTimersToNextFrame();
    const callCount = onResolved.mock.calls.length;
    vi.advanceTimersToNextFrame();

    expect(onResolved).toHaveBeenLastCalledWith(ionContent);
    expect(onResolved).toHaveBeenCalledTimes(callCount);
  });

  it('stops waiting once stopped', () => {
    const { ionContent, render } = createIonContent({
      hostOverflow: 'hidden',
      ionOverflow: 'auto',
    });
    const onResolved = vi.fn();

    const stop = resolveScrollableElementWithRetry(ionContent, onResolved);
    stop();
    render();
    vi.advanceTimersToNextFrame();

    expect(onResolved).toHaveBeenCalledTimes(1);
  });
});
