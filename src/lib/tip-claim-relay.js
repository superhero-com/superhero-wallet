import axios from 'axios';
import { uniq } from 'lodash-es';
import { contractCallStatic, getActiveAccount, getAddressFromChainName } from './background-utils';
import { networks, DEFAULT_NETWORK, TIPPING_CONTRACT, TIP_SERVICE } from '../popup/utils/constants';
import { convertToAE } from '../popup/utils/helper';

export default {
  checkAddressMatch(account, addresses) {
    return account == addresses || (Array.isArray(addresses) && addresses.includes(account));
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
                  .post(`${TIP_SERVICE}`, {
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
