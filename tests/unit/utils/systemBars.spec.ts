import type { Mock } from 'vitest';

/** The color of the launch splash, which the bars keep until it hides */
const BLACK = '#000000';

const setStatusBarColor = vi.fn();
const setEdgeToEdgeStatusBarColor = vi.fn();
const setNavigationBarColor = vi.fn();
const hideSplash = vi.fn();

const colorsOf = (setColor: Mock) => setColor.mock.calls.map(([{ color }]) => color);

/** Loads a fresh module, as at app launch, with the native plugins mocked. */
async function launch({ isAndroid = false } = {}) {
  vi.resetModules();
  vi.doMock('@/constants', async () => ({
    ...await vi.importActual<object>('@/constants'),
    IS_MOBILE_APP: true,
    IS_ANDROID: isAndroid,
  }));
  vi.doMock('@capacitor/core', async () => {
    const actual = await vi.importActual<typeof import('@capacitor/core')>('@capacitor/core');
    return {
      ...actual,
      registerPlugin: (name: string) => (
        name === 'NavigationBar' ? { setColor: setNavigationBarColor } : actual.registerPlugin(name)
      ),
    };
  });
  vi.doMock('@capacitor/status-bar', () => ({
    StatusBar: { setBackgroundColor: setStatusBarColor },
  }));
  vi.doMock('@capacitor/splash-screen', () => ({ SplashScreen: { hide: hideSplash } }));
  vi.doMock('@capawesome/capacitor-android-edge-to-edge-support', () => ({
    EdgeToEdge: { setStatusBarColor: setEdgeToEdgeStatusBarColor },
  }));
  return import('@/utils/systemBars');
}

describe('system bar colors around the launch splash', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hideSplash.mockResolvedValue(undefined);
  });

  it('keeps the iOS status bar black until the splash has hidden, then shows the last color', async () => {
    const { setMobileStatusBarColor, hideSplashScreen } = await launch();
    let finishHiding = () => {};
    hideSplash.mockReturnValue(new Promise<void>((resolve) => { finishHiding = resolve; }));

    await setMobileStatusBarColor('#141414');
    await setMobileStatusBarColor('#191919');
    const hiding = hideSplashScreen();
    await new Promise((resolve) => { setTimeout(resolve); });
    expect(hideSplash).toHaveBeenCalledWith({ fadeOutDuration: 300 });
    expect(new Set(colorsOf(setStatusBarColor))).toEqual(new Set([BLACK]));

    finishHiding();
    await hiding;
    expect(colorsOf(setStatusBarColor).at(-1)).toBe('#191919');

    await setMobileStatusBarColor('#141414');
    expect(colorsOf(setStatusBarColor).at(-1)).toBe('#141414');
  });

  it('shows the last color even if the splash fails to hide', async () => {
    const { setMobileStatusBarColor, hideSplashScreen } = await launch();
    hideSplash.mockRejectedValue(new Error('Unable to hide Splash Screen'));

    await setMobileStatusBarColor('#191919');
    await expect(hideSplashScreen()).rejects.toThrow('Unable to hide Splash Screen');

    expect(colorsOf(setStatusBarColor)).toEqual([BLACK, '#191919']);
  });

  it('colors both Android bars the same way', async () => {
    const { setMobileStatusBarColor, hideSplashScreen } = await launch({ isAndroid: true });

    await setMobileStatusBarColor('#141414');
    await hideSplashScreen();

    expect(colorsOf(setEdgeToEdgeStatusBarColor)).toEqual([BLACK, '#141414']);
    expect(colorsOf(setNavigationBarColor)).toEqual([BLACK, '#141414']);
    expect(setStatusBarColor).not.toHaveBeenCalled();
  });
});
