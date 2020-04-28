import axios from 'axios';
import { BACKEND_URL } from '../../popup/utils/constants';
import { getTwitterAccountUrl } from '../../popup/utils/helper';

export default store =>
  store.registerModule('tipUrl', {
    namespaced: true,
    state: {
      verifiedUrls: [],
      blacklistedUrls: [],
    },

    getters: {
      status: ({ verifiedUrls, blacklistedUrls }) => tipUrl => {
        store.dispatch('tipUrl/ensureFetched');
        if (!tipUrl) return 'not-supported';
        const twitterProfile = getTwitterAccountUrl(tipUrl);
        const url = twitterProfile || tipUrl;
        let status;
        if (blacklistedUrls.some(u => url.includes(u))) {
          status = 'blacklisted';
        } else if (verifiedUrls.includes(url)) {
          status = 'verified';
        } else {
          status = 'not-supported';
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
      async ensureFetched({ state: { verifiedUrls, blacklistedUrls }, commit }) {
        if (verifiedUrls.length && blacklistedUrls.length) return;
        const [{ data: verified }, { data: graylist }] = await Promise.all([
          axios.get(`${BACKEND_URL}/verified`),
          axios.get(`${BACKEND_URL}/static/wallet/graylist`),
        ]);
        commit('setVerified', verified);
        commit('setBlacklisted', graylist);
      },
    },
  });
