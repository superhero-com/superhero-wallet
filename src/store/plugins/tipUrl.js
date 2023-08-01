import { fetchJson, isUrlValid } from '@/utils';

function getTwitterAccountUrl(url) {
  const match = url.match(/https:\/\/twitter.com\/[a-zA-Z0-9_]+/g);
  return match ? match[0] : false;
}

export default (store) => store.registerModule('tipUrl', {
  namespaced: true,
  state: {
    verifiedUrls: [],
    blacklistedUrls: [],
  },

  getters: {
    status: ({ verifiedUrls, blacklistedUrls }) => (tipUrl) => {
      store.dispatch('tipUrl/ensureFetched');
      if (!tipUrl) return 'default';
      const twitterProfile = getTwitterAccountUrl(tipUrl);
      const url = twitterProfile || tipUrl;
      let status;
      if (blacklistedUrls.some((u) => url.includes(u))) {
        status = 'blacklisted';
      } else if (verifiedUrls.includes(url)) {
        status = 'verified';
      } else if (isUrlValid(url) && url.startsWith('http:')) {
        status = 'not-secure';
      } else {
        status = 'not-verified';
      }
      return status;
    },
  },
  mutations: {
    setVerified(state, verified) {
      state.verifiedUrls = verified;
    },
    setBlacklisted(state, blacklisted) {
      state.blacklistedUrls = blacklisted;
    },
  },
  actions: {
    async ensureFetched({ state: { verifiedUrls, blacklistedUrls }, commit, rootGetters }) {
      if (verifiedUrls.length && blacklistedUrls.length) return;

      const [verified, graylist] = await Promise.all([
        fetchJson(`${rootGetters.activeNetwork.backendUrl}/verified`),
        fetchJson(`${rootGetters.activeNetwork.backendUrl}/static/wallet/graylist`),
      ]);

      commit('setVerified', verified);
      commit('setBlacklisted', graylist);
    },
  },
});
