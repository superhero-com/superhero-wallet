import { uniq } from 'lodash-es';
import { postJson } from '../popup/utils/helper';
import { defaultNetwork } from '../popup/utils/constants';
import { contractCallStatic, getAddressFromChainName } from './utils';
import Logger from '../lib/logger';
import store from './store';

export default {
  checkAddressMatch(account, addresses) {
    return account === addresses || (Array.isArray(addresses) && addresses.includes(account));
  },

  async abortIfZeroClaim(url) {
    const tx = {
      method: 'unclaimed_for_url',
      address: defaultNetwork.tipContractV1,
      params: [url],
    };

    const claimAmount = await contractCallStatic({ tx, callType: 'static' })
      .then((r) => r.decodedResult)
      .catch((error) => {
        Logger.write(error);
        return 1;
      });
    if (claimAmount === 0) throw new Error('No new tips to claim');
  },

  async checkUrlHasBalance(url, { address, chainName }) {
    try {
      const { account } = store.getters;
      if (account && account.address) {
        let addresses = [address];
        if (Array.isArray(address)) addresses = address;

        if (chainName) {
          const pubKeys = await getAddressFromChainName(uniq(chainName));
          addresses = [...addresses, ...pubKeys];
        }

        if (this.checkAddressMatch(account.address, uniq(addresses))) {
          await this.abortIfZeroClaim(url);
          // This check is only used on mainnet
          const { backendUrl } = defaultNetwork;
          await postJson(`${backendUrl}/claim/submit`, {
            body: { url, address: account.address },
          });
        }
      }
    } catch (e) {
      e.payload = { url };
      Logger.write(e);
    }
  },
};
