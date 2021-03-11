import { flatten, orderBy, uniq } from 'lodash-es';
import TIPPING_V1_INTERFACE from 'tipping-contract/Tipping_v1_Interface.aes';
import TIPPING_V2_INTERFACE from 'tipping-contract/Tipping_v2_Interface.aes';
import { postMessage, postMessageToContent } from '../popup/utils/connection';
import { AEX2_METHODS } from '../popup/utils/constants';
import {
  fetchJson,
  getAddressByNameEntry,
  parseFromStorage,
  postJson,
  stringifyForStorage,
  handleUnknownError,
  isAccountNotFoundError,
} from '../popup/utils/helper';
import { i18n } from './plugins/languages';

export default {
  switchNetwork({ commit }, payload) {
    commit('switchNetwork', payload);
    commit('updateLatestTransactions', []);
    commit('setNodeStatus', 'connecting');
    if (process.env.IS_EXTENSION) postMessage({ type: AEX2_METHODS.SWITCH_NETWORK, payload });
  },
  async fetchPendingTransactions({
    state: {
      sdk,
      account: { address },
    },
  }) {
    return (
      await sdk.api.getPendingAccountTransactionsByPubkey(address).then(
        (r) => r.transactions,
        (error) => {
          if (!isAccountNotFoundError(error)) {
            handleUnknownError(error);
          }
          return [];
        },
      )
    ).map((transaction) => ({ ...transaction, pending: true }));
  },
  async fetchTransactions({ state, getters, dispatch }, { limit, page, recent }) {
    if (!state.middleware) return [];
    const { address } = state.account;
    let txs = await Promise.all([
      state.middleware.getTxByAccount(address, limit, page).then(({ data }) => data),
      dispatch('fetchPendingTransactions'),
      fetchJson(
        `${getters.activeNetwork.backendUrl}/cache/events/?address=${address}&event=TipWithdrawn${
          recent ? `&limit=${limit}` : ``
        }`,
      )
        .then((response) =>
          response.map(({ amount, ...t }) => ({
            tx: { address, amount },
            ...t,
            microTime: t.time,
            claim: true,
          })),
        )
        .catch(() => []),
    ]);
    txs = orderBy(flatten(txs), ['microTime'], ['desc']);
    return recent ? txs.slice(0, limit) : txs;
  },

  async getAccount(context, { idx }) {
    return (await postMessage({ type: 'getAccount', payload: { idx } })).address;
  },

  async getKeyPair({ state: { account } }, { idx }) {
    const { address, secretKey } = parseFromStorage(
      await postMessage({
        type: 'getKeypair',
        payload: { activeAccount: idx, account: { address: account.address } },
      }),
    );
    return { address, secretKey };
  },

  async generateWallet(context, { seed }) {
    return (
      await postMessage({ type: 'generateWallet', payload: { seed: stringifyForStorage(seed) } })
    ).address;
  },

  async setLogin({ commit }, { keypair }) {
    commit('updateAccount', keypair);
    commit('setActiveAccount', { address: keypair.address, index: 0 });
    commit('updateAccount', keypair);
    commit('switchLoggedIn', true);
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
  async getWebPageAddresses({ state: { sdk } }) {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const { address, chainName } = await postMessageToContent(
      { method: 'getAddresses' },
      tab.id,
    ).catch(() => ({ address: [], chainName: [] }));
    let addresses = Array.isArray(address) ? address : [address];
    const chainNames = Array.isArray(chainName) ? chainName : [chainName];
    const chainNamesAddresses = await Promise.all(
      chainNames.map(async (n) => {
        try {
          return getAddressByNameEntry(await sdk.api.getNameEntryByName(n));
        } catch (e) {
          return null;
        }
      }),
    );
    addresses = [...addresses, ...chainNamesAddresses];

    return { addresses: uniq(addresses).filter((a) => a), tab };
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
  async cacheInvalidateFT({ getters: { activeNetwork } }, contract) {
    return fetchJson(`${activeNetwork.backendUrl}/cache/invalidate/token/${contract}`);
  },
  async donateError({ getters: { activeNetwork } }, error) {
    return postJson(`${activeNetwork.backendUrl}/errorreport`, { body: error });
  },
  async sendTipComment(
    { state: { sdk }, getters: { activeNetwork } },
    [tipId, text, author, parentId],
  ) {
    const sendComment = async (postParam) =>
      postJson(`${activeNetwork.backendUrl}/comment/api/`, { body: postParam });

    const responseChallenge = await sendComment({ tipId, text, author, parentId });
    const signedChallenge = Buffer.from(
      await sdk.signMessage(responseChallenge.challenge),
    ).toString('hex');
    const respondChallenge = {
      challenge: responseChallenge.challenge,
      signature: signedChallenge,
    };
    return sendComment(respondChallenge);
  },
  async modifyNotification(
    {
      state: {
        sdk,
        account: { address },
      },
      getters: { activeNetwork },
    },
    [notifId, status],
  ) {
    const backendMethod = async (postParam) =>
      postJson(`${activeNetwork.backendUrl}/notification/${notifId}`, { body: postParam });

    const responseChallenge = await backendMethod({ author: address, status });
    const signedChallenge = Buffer.from(
      await sdk.signMessage(responseChallenge.challenge),
    ).toString('hex');
    const respondChallenge = {
      challenge: responseChallenge.challenge,
      signature: signedChallenge,
    };

    backendMethod(respondChallenge);
  },
  async modifyNotifications(
    {
      state: {
        sdk,
        account: { address },
      },
      getters: { activeNetwork },
    },
    [ids, status],
  ) {
    if (!ids.length) return;
    const backendMethod = async (postParam) =>
      postJson(`${activeNetwork.backendUrl}/notification`, { body: postParam });

    const responseChallenge = await backendMethod({ ids, status, author: address });
    const signedChallenge = Buffer.from(
      await sdk.signMessage(responseChallenge.challenge),
    ).toString('hex');
    const respondChallenge = {
      challenge: responseChallenge.challenge,
      signature: signedChallenge,
    };

    backendMethod(respondChallenge);
  },
  async getCacheChainNames({ getters: { activeNetwork } }) {
    return fetchJson(`${activeNetwork.backendUrl}/cache/chainnames`);
  },
  async getAllNotifications({ state: { sdk }, getters: { activeNetwork, account } }) {
    const responseChallenge = await fetchJson(
      `${activeNetwork.backendUrl}/notification/user/${account.address}`,
    );
    const signedChallenge = Buffer.from(
      await sdk.signMessage(responseChallenge.challenge),
    ).toString('hex');

    const respondChallenge = {
      challenge: responseChallenge.challenge,
      signature: signedChallenge,
    };
    const url = new URL(`${activeNetwork.backendUrl}/notification/user/${account.address}`);
    Object.keys(respondChallenge).forEach((key) =>
      url.searchParams.append(key, respondChallenge[key]),
    );
    return fetchJson(url.toString());
  },
  async initContractInstances({
    state: { sdk },
    getters: { activeNetwork, tippingSupported },
    commit,
  }) {
    if (!tippingSupported && !process.env.RUNNING_IN_TESTS) return;
    const contractInstanceV1 = await sdk.getContractInstance(TIPPING_V1_INTERFACE, {
      contractAddress: activeNetwork.tipContractV1,
      forceCodeCheck: true,
    });
    const contractInstanceV2 = activeNetwork.tipContractV2
      ? await sdk.getContractInstance(TIPPING_V2_INTERFACE, {
          contractAddress: activeNetwork.tipContractV2,
          forceCodeCheck: true,
        })
      : null;
    commit('setTipping', [contractInstanceV1, contractInstanceV2]);
  },
  async requestResetting({ dispatch }) {
    await dispatch('modals/open', {
      name: 'confirm',
      title: i18n.t('modals.removeAccount.title'),
      msg: i18n.t('modals.removeAccount.msg'),
    });
    await dispatch('reset');
  },
};
