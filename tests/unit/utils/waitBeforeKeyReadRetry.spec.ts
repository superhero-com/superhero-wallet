// @ts-nocheck
describe('waitBeforeKeyReadRetry', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves once the given time has passed', async () => {
    // The vitest setup stubs it for every other spec.
    const { waitBeforeKeyReadRetry } = await vi.importActual('@/utils/waitBeforeKeyReadRetry');
    vi.useFakeTimers();
    let isDone = false;

    waitBeforeKeyReadRetry(200).then(() => { isDone = true; });

    await vi.advanceTimersByTimeAsync(199);
    expect(isDone).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(isDone).toBe(true);
  });
});
