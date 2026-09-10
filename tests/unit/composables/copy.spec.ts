// @ts-nocheck
/**
 * `useCopy` needs only its native clipboard bridge mocked - everything else (the
 * `copied` flag, the reset timeout) is real composable logic.
 *
 * `@capacitor/clipboard` is already loaded for real by the time this file's own
 * (hoisted) `vi.mock` runs - the global `registerAdapters` setup file transitively
 * pulls it in via the `@/composables` barrel before any test file executes. So each
 * test resets the module registry and re-imports `useCopy` fresh, ensuring it binds
 * to the mocked `Clipboard` instead of the one cached during setup.
 */
const { clipboardWriteMock } = vi.hoisted(() => ({
  clipboardWriteMock: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@capacitor/clipboard', () => ({ Clipboard: { write: clipboardWriteMock } }));

describe('useCopy', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    clipboardWriteMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('copies the given text and flips `copied` back to false after the timeout', async () => {
    const { useCopy } = await import('@/composables/copy');
    const { copy, copied } = useCopy({ timeout: 500 });

    expect(copied.value).toBe(false);
    await copy('some text');

    expect(clipboardWriteMock).toHaveBeenCalledWith({ string: 'some text' });
    expect(copied.value).toBe(true);

    vi.advanceTimersByTime(499);
    expect(copied.value).toBe(true);

    vi.advanceTimersByTime(1);
    expect(copied.value).toBe(false);
  });

  it('does nothing for empty/undefined text', async () => {
    const { useCopy } = await import('@/composables/copy');
    const { copy, copied } = useCopy();

    await copy();
    await copy('');

    expect(copied.value).toBe(false);
    expect(clipboardWriteMock).not.toHaveBeenCalled();
  });

  it('defaults the reset timeout to 1000ms', async () => {
    const { useCopy } = await import('@/composables/copy');
    const { copy, copied } = useCopy();

    await copy('x');
    expect(copied.value).toBe(true);

    vi.advanceTimersByTime(999);
    expect(copied.value).toBe(true);

    vi.advanceTimersByTime(1);
    expect(copied.value).toBe(false);
  });

  it('creates an independent `copied` flag per call, not a shared singleton', async () => {
    const { useCopy } = await import('@/composables/copy');
    const first = useCopy();
    const second = useCopy();

    await first.copy('a');

    expect(first.copied.value).toBe(true);
    expect(second.copied.value).toBe(false);
  });
});
