/**
 * Injected into every page the in-app browser loads: an EIP-1193/EIP-6963 provider
 * and a relay for AEX-2 messages. It is injected as is, not bundled.
 *
 * Every frame of the page can reach the native bridge, so each message carries a token
 * that only this closure knows. The session string is replaced before injection.
 */
((session) => {
  // The page may have navigated since `loadstop`; the token must not reach another origin.
  if (window.location.origin !== session.origin) return;

  if (window.superheroInAppBrowser) {
    window.superheroInAppBrowser.connect(session.token);
    return;
  }

  const bridge = window.cordova_iab || window.webkit.messageHandlers.cordova_iab;
  let { token } = session;
  const send = (message) => bridge.postMessage(JSON.stringify({ ...message, token }));

  Object.defineProperty(window, 'superheroInAppBrowser', {
    value: Object.freeze({
      connect(newToken) {
        token = newToken;
        send({ kind: 'ready', isNew: false });
      },
    }),
  });
  send({ kind: 'ready', isNew: true });

  const listeners = {};
  const pendingRequests = {};
  let lastRequestId = 0;

  window.addEventListener('message', ({ data, source }) => {
    if (source !== window || !data) return;
    if (data.type === 'to_waellet' && data.data) {
      send({ kind: 'aepp', data: data.data });
    } else if (data.superheroInAppBrowser === 'response' && pendingRequests[data.id]) {
      const { resolve, reject } = pendingRequests[data.id];
      delete pendingRequests[data.id];
      if (data.error) {
        reject(Object.assign(new Error(data.error.message), data.error));
      } else {
        resolve(data.result);
      }
    } else if (data.superheroInAppBrowser === 'event') {
      (listeners[data.event] || []).forEach((listener) => listener(data.data));
    }
  });

  const provider = {
    isSuperheroWallet: true,
    isConnected: () => true,
    request({ method, params }) {
      lastRequestId += 1;
      const id = lastRequestId;
      return new Promise((resolve, reject) => {
        pendingRequests[id] = { resolve, reject };
        send({
          kind: 'request',
          id,
          method,
          params,
        });
      });
    },
    on(event, listener) {
      listeners[event] = [...(listeners[event] || []), listener];
      return provider;
    },
    removeListener(event, listener) {
      listeners[event] = (listeners[event] || []).filter((item) => item !== listener);
      return provider;
    },
  };

  if (window.ethereum === undefined) window.ethereum = provider;
  const announce = () => window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
    detail: Object.freeze({ info: Object.freeze(session.providerInfo), provider }),
  }));
  window.addEventListener('eip6963:requestProvider', announce);
  announce();
  window.dispatchEvent(new Event('ethereum#initialized'));
})('__SUPERHERO_SESSION__');
