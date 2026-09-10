if (process.env.IS_EXTENSION) {
  // In extension builds the bare `browser` global is provided everywhere by
  // @rollup/plugin-inject (webextension-polyfill). Mirror it onto window /
  // globalThis for code that reads `window.browser` explicitly. In the service
  // worker `window` is undefined, so fall back to globalThis.
  try {
    window.browser = browser;
  } catch (error) {
    globalThis.browser = browser;
  }
} else {
  window.browser = {
    runtime: {
      getURL: (url) => url,
    },
    storage: {
      local: {
        get(key) {
          const keys = Array.isArray(key) ? key : [key];
          return Promise.resolve(
            Object.fromEntries(keys
              .map((k) => {
                const v = localStorage.getItem(k);
                return [k, v === null ? undefined : JSON.parse(v)];
              })
              .filter(([, value]) => value !== undefined)
              .map(([k, v]) => [k, v])),
          );
        },
        set(object) {
          Object.entries(object)
            .forEach(([key, value]) => localStorage.setItem(key, JSON.stringify(value)));
          return Promise.resolve();
        },
        remove(key) {
          const keys = Array.isArray(key) ? key : [key];
          keys.forEach((k) => localStorage.removeItem(k));
          return Promise.resolve();
        },
        clear() {
          localStorage.clear();
          return Promise.resolve();
        },
      },
    },
  };
}
