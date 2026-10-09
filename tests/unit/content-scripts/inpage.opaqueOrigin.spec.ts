// @ts-nocheck
/**
 * The inpage provider must not advertise itself in a frame with an opaque origin
 * (see inject.opaqueOrigin.spec.ts). `location.origin` stays real there.
 */
describe('inpage.ts opaque origin frames', () => {
  const URL_ORIGIN = 'https://platform.twitter.com';

  const loadInpage = async (origin: string) => {
    vi.stubGlobal('location', {
      ...window.location,
      origin: URL_ORIGIN,
      href: `${URL_ORIGIN}/embed/Tweet.html`,
    });
    vi.stubGlobal('origin', origin);
    vi.spyOn(window, 'addEventListener');
    vi.spyOn(window, 'dispatchEvent');
    vi.resetModules();
    await import('@/content-scripts/inpage');
  };

  const getEventTypes = (spy) => (spy as vi.Mock).mock.calls.map(([event]) => event.type ?? event);

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('does not inject the provider when the frame origin is opaque', async () => {
    await loadInpage('null');

    expect(getEventTypes(window.addEventListener)).not.toContain('message');
    expect(getEventTypes(window.dispatchEvent)).not.toContain('ethereum#initialized');
  });

  it('injects the provider on a real origin', async () => {
    await loadInpage(URL_ORIGIN);

    expect(getEventTypes(window.addEventListener)).toContain('message');
    expect(getEventTypes(window.dispatchEvent)).toContain('ethereum#initialized');
  });
});
