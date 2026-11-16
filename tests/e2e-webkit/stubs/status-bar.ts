// The StatusBar plugin has no web version. It saves colors in window.statusBarColors, nothing else.
export enum Style {
  Dark = 'DARK',
  Light = 'LIGHT',
  Default = 'DEFAULT',
}

export const StatusBar = new Proxy({}, {
  get: (_, method) => {
    if (method === 'then') return undefined;
    if (method === 'setBackgroundColor') {
      return async ({ color }: { color: string }) => {
        const appWindow = window as typeof window & { statusBarColors?: string[] };
        appWindow.statusBarColors ??= [];
        appWindow.statusBarColors.push(color);
      };
    }
    return async () => {};
  },
});
