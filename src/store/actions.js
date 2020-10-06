import { flatten, uniq, orderBy } from 'lodash-es';
import axios from 'axios';
import {
  convertToAE,
  stringifyForStorage,
  parseFromStorage,
  getAddressByNameEntry,
} from '../popup/utils/helper';
import { postMessage, postMessageToContent } from '../popup/utils/connection';
import { AEX2_METHODS } from '../popup/utils/constants';

export default {
  setAccount({ commit }, payload) {
    commit('updateAccount', payload);
    commit('updateBalance');
  },
  switchNetwork({ commit }, payload) {
    commit('switchNetwork', payload);
    commit('updateLatestTransactions', []);
    commit('setNodeStatus', 'connecting');
    if (process.env.IS_EXTENSION) postMessage({ type: AEX2_METHODS.SWITCH_NETWORK, payload });
  },
  async updateBalance({ commit, state }) {
    const balance = await state.sdk.balance(state.account.publicKey).catch(() => 0);
    commit('updateBalance', convertToAE(balance));
  },
  async fetchTransactions({ state, getters }, { limit, page, recent }) {
    if (!state.middleware) return [];
    const { publicKey } = state.account;
    let txs = await Promise.all([
      state.middleware.getTxByAccount(publicKey, { limit, page }),
      (async () => {
        const transactionsFromEvents = await getters.backendInstance
          .getTxEvents(publicKey, recent, limit)
          .catch(() => []);
        return transactionsFromEvents.map(({ address, amount, ...t }) => ({
          tx: { address, amount },
          ...t,
          claim: true,
        }));
      })(),
    ]);
    txs = orderBy(flatten(txs), ['time'], ['desc']);
    return recent ? txs.slice(0, limit) : txs;
  },

  unlockWallet(context, payload) {
    return postMessage({ type: 'unlockWallet', payload });
  },

  async getAccount(context, { idx }) {
    return (await postMessage({ type: 'getAccount', payload: { idx } })).address;
  },

  async getKeyPair({ state: { account } }, { idx }) {
    const { publicKey, secretKey } = parseFromStorage(
      await postMessage({
        type: 'getKeypair',
        payload: { activeAccount: idx, account: { publicKey: account.publicKey } },
      }),
    );
    return { publicKey, secretKey };
  },

  async generateWallet(context, { seed }) {
    return (
      await postMessage({ type: 'generateWallet', payload: { seed: stringifyForStorage(seed) } })
    ).address;
  },

  async setLogin({ commit }, { keypair }) {
    commit('updateAccount', keypair);
    commit('setActiveAccount', { publicKey: keypair.publicKey, index: 0 });
    commit('updateAccount', keypair);
    commit('switchLoggedIn', true);
  },
  async setPendingTx({ commit, state: { transactions } }, tx) {
    commit('setPendingTxs', [...transactions.pending, tx]);
  },
  async getCurrencies({ state: { nextCurrenciesFetch }, commit }) {
    if (!nextCurrenciesFetch || nextCurrenciesFetch <= new Date().getTime()) {
      try {
        const { aeternity } = (
          await axios.get(
            'https://api.coingecko.com/api/v3/simple/price?ids=aeternity&vs_currencies=usd,eur,aud,ron,brl,cad,chf,cny,czk,dkk,gbp,hkd,hrk,huf,idr,ils,inr,isk,jpy,krw,mxn,myr,nok,nzd,php,pln,ron,rub,sek,sgd,thb,try,zar,xau',
          )
        ).data;
        commit('setCurrencies', aeternity);
        commit('setNextCurrencyFetch', new Date().getTime() + 3600000);
      } catch (e) {
        console.error(`Cannot fetch currencies: ${e}`);
      }
    }
  },
  async setPermissionForAccount({ commit, state: { connectedAepps } }, { host, account }) {
    if (connectedAepps[host]) {
      if (connectedAepps[host].includes(account)) return;
      commit('updateConnectedAepp', { host, account });
    } else {
      commit('addConnectedAepp', { host, account });
    }
  },
  async getWebPageAddresses({ state: { sdk } }) {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const { address, chainName } = await postMessageToContent(
      { method: 'getAddresses' },
      tab.id,
    ).catch(() => ({ address: [], chainName: [] }));
    let addresses = Array.isArray(address) ? address : [address];
    const chainNames = Array.isArray(chainName) ? chainName : [chainName];
    const chainNamesAddresses = await Promise.all(
      chainNames.map(async n => {
        try {
          return getAddressByNameEntry(await sdk.api.getNameEntryByName(n));
        } catch (e) {
          return null;
        }
      }),
    );
    addresses = [...addresses, ...chainNamesAddresses];

    return { addresses: uniq(addresses).filter(a => a), tab };
  },

  async getTipContractAddress({ state: { sdk }, getters: { activeNetwork }, commit }) {
    const { tipContract } = activeNetwork;
    const contractAddress = tipContract.includes('.chain')
      ? getAddressByNameEntry(await sdk.api.getNameEntryByName(tipContract), 'contract_pubkey')
      : tipContract;
    commit('setTippingAddress', contractAddress);
    return contractAddress;
  },
  async getHeight({ state: { sdk } }) {
    return (await sdk.topBlock()).height;
  },
};
