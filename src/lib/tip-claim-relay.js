import axios from 'axios';
import { uniq } from 'lodash-es';
import { contractCallStatic, getActiveAccount, getAddressFromChainName } from './background-utils';
import { networks, DEFAULT_NETWORK, TIPPING_CONTRACT } from '../popup/utils/constants';
import { convertToAE } from '../popup/utils/helper';

const SERVICE_URL = 'https://payfortx.z52da5wt.xyz';

export default {
  init() {},
  signPersonalMessage(content = '') {},

  sendMessageToService(message = '') {},

  checkAddressMatch(account, addresses) {
    if (account == addresses || (Array.isArray(addresses) && addresses.includes(account))) {
      return true;
    }
    return false;
  },

  async checkUrlHasBalance(url, { address, chainName }) {
    try {
      const { account } = await getActiveAccount();
      if (account && account.publicKey) {
        const tippingAddress = networks[DEFAULT_NETWORK].tipContract;
        const tx = {
          method: 'unpaid',
          address: tippingAddress,
          params: [url],
          source: TIPPING_CONTRACT,
        };
        let addresses = [address];
        if (Array.isArray(address)) {
          addresses = address;
        }
        if (chainName) {
          const pub_keys = await getAddressFromChainName(uniq(chainName));
          addresses = [...addresses, ...pub_keys];
        }
        if (this.checkAddressMatch(account.publicKey, uniq(addresses))) {
          contractCallStatic({ tx, callType: 'static' })
            .then(res => {
              const amount = convertToAE(res.decodedResult);
              if (amount) {
                axios
                  .post(`${SERVICE_URL}/submit`, {
                    url,
                    address: account.publicKey,
                  })
                  .then(res => {
                    console.log(res);
                  });
              }
            })
            .catch(err => {
              console.log(err);
            });
        }
      }
    } catch (err) {
      console.log('err', err);
    }
  },
};
