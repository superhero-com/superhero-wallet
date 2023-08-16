import {
  fetchJson,
  postJson,
} from '../popup/utils';

export default {
  switchNetwork({ commit }, payload) {
    commit('switchNetwork', payload);
  },
  async claimTips({ getters: { activeNetwork } }, { url, address }) {
    return postJson(`${activeNetwork.backendUrl}/claim/submit`, { body: { url, address } });
  },
  async cacheInvalidateOracle({ getters: { activeNetwork } }) {
    return fetchJson(`${activeNetwork.backendUrl}/cache/invalidate/oracle`);
  },
  async cacheInvalidateTips({ getters: { activeNetwork } }) {
    return fetchJson(`${activeNetwork.backendUrl}/cache/invalidate/tips`);
  },
  async donateError({ getters: { activeNetwork } }, error) {
    return postJson(`${activeNetwork.backendUrl}/errorreport`, { body: error });
  },
  async getCacheChainNames({ getters: { activeNetwork } }) {
    return fetchJson(`${activeNetwork.backendUrl}/cache/chainnames`);
  },
  async getCacheTip({ getters: { activeNetwork } }, id) {
    return fetchJson(`${activeNetwork.backendUrl}/tips/single/${id}`);
  },
  async share(_, options) {
    await (process.env.IS_CORDOVA
      ? new Promise((resolve) => window.plugins.socialsharing.shareW3C(
        options,
        ({ app }) => app && resolve(),
      ))
      : navigator.share(options));
  },
};
