import axios from 'axios';
import { contractCallStatic, getActiveAccount } from './background-utils';
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

  async checkUrlHasBalance(url, addresses) {
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
        if (this.checkAddressMatch(account.publicKey, addresses)) {
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
