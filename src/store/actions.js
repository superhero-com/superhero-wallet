import { flatten, uniq, orderBy } from 'lodash-es';
import {
  convertToAE,
  stringifyForStorage,
  parseFromStorage,
  getAddressByNameEntry,
  fetchJson,
  postJson,
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
      fetchJson(
        `${getters.activeNetwork.backendUrl}/cache/events/?address=${publicKey}&event=TipWithdrawn${
          recent ? `&limit=${limit}` : ``
        }`,
      )
        .then(response =>
          response.map(({ address, amount, ...t }) => ({
            tx: { address, amount },
            ...t,
            claim: true,
          })),
        )
        .catch(() => []),
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
        const { aeternity } = await fetchJson(
          'https://api.coingecko.com/api/v3/simple/price?ids=aeternity&vs_currencies=usd,eur,aud,ron,brl,cad,chf,cny,czk,dkk,gbp,hkd,hrk,huf,idr,ils,inr,isk,jpy,krw,mxn,myr,nok,nzd,php,pln,ron,rub,sek,sgd,thb,try,zar,xau',
        );
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
  async claimTips({ getters: { activeNetwork } }, { url, address }) {
    return postJson(`${activeNetwork.backendUrl}/claim/submit`, { body: { url, address } });
  },
  async cacheInvalidateOracle({ getters: { activeNetwork } }) {
    return fetchJson(`${activeNetwork.backendUrl}/cache/invalidate/oracle`);
  },
  async cacheInvalidateTips({ getters: { activeNetwork } }) {
    return fetchJson(`${activeNetwork.backendUrl}/cache/invalidate/tips`);
  },
  async donateError({ getters: { activeNetwork } }, { error, description }) {
    return postJson(`${activeNetwork.backendUrl}/errorreport`, { body: { ...error, description } });
  },
  async sendTipComment(
    { state: { sdk }, getters: { activeNetwork } },
    [tipId, text, author, parentId],
  ) {
    const sendComment = async postParam =>
      postJson(`${activeNetwork.backendUrl}/comment/api/`, { body: postParam });

    const responseChallenge = await sendComment({ tipId, text, author });
    const signedChallenge = Buffer.from(
      await sdk.signMessage(responseChallenge.challenge),
    ).toString('hex');
    const respondChallenge = {
      challenge: responseChallenge.challenge,
      signature: signedChallenge,
      parentId,
    };
    return sendComment(respondChallenge);
  },
  async modifyNotification(
    { state: { sdk }, getters: { activeNetwork } },
    [notifId, status, author],
  ) {
    const backendMethod = async postParam =>
      postJson(`${activeNetwork.backendUrl}/notification/${notifId}`, { body: postParam });

    const responseChallenge = await backendMethod({ author, status });
    const signedChallenge = Buffer.from(
      await sdk.signMessage(responseChallenge.challenge),
    ).toString('hex');
    const respondChallenge = {
      challenge: responseChallenge.challenge,
      signature: signedChallenge,
    };

    return backendMethod(respondChallenge);
  },
  async getCacheChainNames({ getters: { activeNetwork } }) {
    return fetchJson(`${activeNetwork.backendUrl}/cache/chainnames`);
  },
  async getAllNotifications({ state: { sdk }, getters: { activeNetwork } }, address) {
    const responseChallenge = await fetchJson(
      `${activeNetwork.backendUrl}/notification/user/${address}`,
    );
    const signedChallenge = Buffer.from(
      await sdk.signMessage(responseChallenge.challenge),
    ).toString('hex');

    const respondChallenge = {
      challenge: responseChallenge.challenge,
      signature: signedChallenge,
    };
    const url = new URL(`${activeNetwork.backendUrl}/notification/user/${address}`);
    Object.keys(respondChallenge).forEach(key =>
      url.searchParams.append(key, respondChallenge[key]),
    );
    return fetchJson(url.toString());
  },
};
