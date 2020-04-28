import { uniq } from 'lodash-es';
import axios from 'axios';
import Logger from './logger';

import {
  contractCallStatic,
  getActiveAccount,
  getAddressFromChainName,
  getTippingContractAddress,
} from './background-utils';
import { networks, DEFAULT_NETWORK, TIPPING_CONTRACT, TIP_SERVICE } from '../popup/utils/constants';

export default {
  checkAddressMatch(account, addresses) {
    return account === addresses || (Array.isArray(addresses) && addresses.includes(account));
  },

  async abortIfZeroClaim(url) {
    const tippingAddress = networks[DEFAULT_NETWORK].tipContract;
    const address = await getTippingContractAddress(tippingAddress);
    const tx = {
      method: 'unclaimed_for_url',
      address,
      params: [url],
      source: TIPPING_CONTRACT,
    };

    const claimAmount = await contractCallStatic({ tx, callType: 'static' })
      .then(r => r.decodedResult)
      .catch(() => 1);
    if (claimAmount === 0) throw new Error('No zero amount claims');
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

          await axios.post(`${TIP_SERVICE}`, { url, address: account.publicKey });
        }
      }
    } catch (e) {
      Logger.write({ e, url, action: 'autoclaim' });
    }
  },
};
