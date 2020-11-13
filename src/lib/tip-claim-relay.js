import { uniq } from 'lodash-es';
import TIPPING_V1_INTERFACE from 'tipping-contract/Tipping_v1_Interface.aes';
import { postJson } from '../popup/utils/helper';
import { defaultNetwork } from '../popup/utils/constants';
import {
  contractCallStatic,
  getActiveAccount,
  getAddressFromChainName,
  getTippingContractAddress,
} from './background-utils';
import Logger from './logger';

export default {
  checkAddressMatch(account, addresses) {
    return account === addresses || (Array.isArray(addresses) && addresses.includes(account));
  },

  async abortIfZeroClaim(url) {
    const { tipContract } = defaultNetwork;
    const address = await getTippingContractAddress(tipContract);
    const tx = {
      method: 'unclaimed_for_url',
      address,
      params: [url],
      source: TIPPING_V1_INTERFACE,
    };

    const claimAmount = await contractCallStatic({ tx, callType: 'static' })
      .then(r => r.decodedResult)
      .catch(error => {
        Logger.write(error);
        return 1;
      });
    if (claimAmount === 0) throw new Error('No new tips to claim');
  },

  async checkUrlHasBalance(url, { address, chainName }) {
    try {
      const { account } = await getActiveAccount();
      if (account && account.publicKey) {
        let addresses = [address];
        if (Array.isArray(address)) addresses = address;

        if (chainName) {
          const pubKeys = await getAddressFromChainName(uniq(chainName));
          addresses = [...addresses, ...pubKeys];
        }

        if (this.checkAddressMatch(account.publicKey, uniq(addresses))) {
          await this.abortIfZeroClaim(url);
          // This check is only used on mainnet
          const { backendUrl } = defaultNetwork;
          await postJson(`${backendUrl}/claim/submit`, {
            body: { url, address: account.publicKey },
          });
        }
      }
    } catch (e) {
      e.payload = { url };
      Logger.write(e);
    }
  },
};
