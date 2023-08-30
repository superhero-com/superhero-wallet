import {
  fetchJson,
  postJson,
} from '@/utils';
import { useAeNetworkSettings } from '@/protocols/aeternity/composables';

export default {
  async claimTips(_, { url, address }) {
    const { aeActiveNetworkSettings } = useAeNetworkSettings();
    return postJson(`${aeActiveNetworkSettings.value.backendUrl}/claim/submit`, { body: { url, address } });
  },
  async cacheInvalidateOracle() {
    const { aeActiveNetworkSettings } = useAeNetworkSettings();
    return fetchJson(`${aeActiveNetworkSettings.value.backendUrl}/cache/invalidate/oracle`);
  },
  async cacheInvalidateTips() {
    const { aeActiveNetworkSettings } = useAeNetworkSettings();
    return fetchJson(`${aeActiveNetworkSettings.value.backendUrl}/cache/invalidate/tips`);
  },
  async donateError(_, error) {
    const { aeActiveNetworkSettings } = useAeNetworkSettings();
    return postJson(`${aeActiveNetworkSettings.value.backendUrl}/errorreport`, { body: error });
  },
  async getCacheChainNames() {
    const { aeActiveNetworkSettings } = useAeNetworkSettings();
    return fetchJson(`${aeActiveNetworkSettings.value.backendUrl}/cache/chainnames`);
  },
  async getCacheTip(_, id) {
    const { aeActiveNetworkSettings } = useAeNetworkSettings();
    return fetchJson(`${aeActiveNetworkSettings.value.backendUrl}/tips/single/${id}`);
  },
};
