export const WalletStorage = {
  get: <T>(key: string): T | null => JSON.parse(localStorage.getItem(key) || 'null'),
  set: (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value)),
  remove: (key: string) => localStorage.removeItem(key),
};
