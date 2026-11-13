// The StatusBar plugin has no web version, so its calls are ignored.
export enum Style {
  Dark = 'DARK',
  Light = 'LIGHT',
  Default = 'DEFAULT',
}

export const StatusBar = new Proxy({}, {
  get: (_, method) => (method === 'then' ? undefined : async () => {}),
});
