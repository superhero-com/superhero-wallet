import { getAddressFromChainName } from './background-utils';

const redirectUrl = 'https://youdonotneedacapetobeahero.com/#/';

export default {
  init() {
    this.setListener();
  },
  supportedDomain(domain) {
    return domain.endsWith('.chain');
  },
  setListener() {
    browser.webRequest.onBeforeRequest.addListener(
      async requestDetails => {
        const url = new URL(requestDetails.url);
        const params = url.searchParams
          .get('q')
          .trim()
          .toLowerCase();
        const q = new URL(`${url.protocol}//${params}`);
        if (!q.hostname || !this.supportedDomain(q.hostname) || url.pathname !== '/search') {
          return;
        }

        chrome.tabs.update({ url: q.toString() });

        // eslint-disable-next-line consistent-return
        return { cancel: true };
      },
      {
        urls: ['*://*.google.com/*'],
        types: ['main_frame'],
      },
      ['blocking']
    );

    browser.webRequest.onBeforeRequest.addListener(
      requestDetails => {
        chrome.tabs.update({ url: '/redirect/index.html' }, async () => {
          try {
            const url = new URL(requestDetails.url);
            const host = url.hostname;
            if (!this.supportedDomain(host)) {
              throw new Error('invalid');
            }
            const pubKey = await getAddressFromChainName(host);
            if (!pubKey) {
              throw new Error(`${host} not found`);
            }
            const displayUrl = `${redirectUrl}user-profile/${pubKey}`;
            chrome.tabs.update({ url: displayUrl });
          } catch (err) {
            chrome.tabs.update({ url: `/redirect/index.html?error=${err.message}` });
          }
        });
        return { cancel: true };
      },
      {
        urls: ['*://*.chain/*'],
        types: ['main_frame'],
      }
    );
  },
};
