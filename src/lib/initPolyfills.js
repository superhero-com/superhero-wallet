if (process.env.IS_EXTENSION) {
  import('webextension-polyfill').then((webExtensionPolyfill) => {
    window.browser = webExtensionPolyfill;
  });
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
