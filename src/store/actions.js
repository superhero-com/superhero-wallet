import {
  flatten, orderBy, uniq, uniqBy,
} from 'lodash-es';
import TIPPING_V1_INTERFACE from 'tipping-contract/Tipping_v1_Interface.aes';
import TIPPING_V2_INTERFACE from 'tipping-contract/Tipping_v2_Interface.aes';
import { SCHEMA } from '@aeternity/aepp-sdk';
import camelcaseKeysDeep from 'camelcase-keys-deep';
import { postMessageToContent } from '../popup/utils/connection';
import {
  fetchJson,
  getAddressByNameEntry,
  postJson,
  handleUnknownError,
  isAccountNotFoundError,
  executeAndSetInterval,
  watchUntilTruthy,
  fetchRespondChallenge,
  CURRENCIES_URL,
  MODAL_DEFAULT,
} from '../popup/utils';
import { i18n } from './plugins/languages';

export default {
  switchNetwork({ commit }, payload) {
    commit('switchNetwork', payload);
    commit('setMiddleware', null);
    commit('initTransactions');
  },

  async selectNetwork({ dispatch, getters }, network) {
    await dispatch('switchNetwork', network);
    if (getters.tippingSupported) return;
    await dispatch('modals/open', {
      name: MODAL_DEFAULT,
      title: i18n.t('modals.tip-mainnet-warning.title'),
      msg: i18n.t('modals.tip-mainnet-warning.msg'),
    });
  },
  addPendingTransaction({ getters: { activeNetwork }, commit }, transaction) {
    commit('addPendingTransaction', {
      network: activeNetwork.networkId,
      transaction: { ...transaction, microTime: Date.now(), pending: true },
    });
  },
  async fetchPendingTransactions(
    { state: { transactions }, getters }, address,
  ) {
    const sdk = await watchUntilTruthy(() => getters['sdkPlugin/sdk']);
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
    )
      .filter((transaction) => !transactions.pending[getters.activeNetwork.networkId]
        ?.find((tx) => tx?.hash === transaction?.hash))
      .map((transaction) => ({ ...transaction, pending: true }));
  },
  // TODO: remove uniqBy and with the `recent` option fetch only recent transactions after https://github.com/aeternity/tipping-community-backend/issues/405, 406 will be resolved
  async fetchTipWithdrawnTransactions({ state, getters, commit }, recent) {
    const { address } = getters.account;
    if (state?.transactions?.tipWithdrawnTransactions?.length && !recent) {
      return state.transactions.tipWithdrawnTransactions;
    }
    const response = await fetchJson(
      `${getters.activeNetwork.backendUrl}/cache/events/?address=${address}&event=TipWithdrawn`,
    );
    if (response.message) return [];
    const tipWithdrawnTransactions = (uniqBy(response, 'hash').map(({
      amount, contract, height, data: { tx }, ...t
    }) => ({
      tx: {
        ...tx,
        address,
        amount,
        contractId: contract,
        type: SCHEMA.TX_TYPE.contractCall,
      },
      ...t,
      microTime: new Date(t.createdAt).getTime(),
      blockHeight: height,
      claim: true,
    })));
    commit('setTipWithdrawnTransactions', tipWithdrawnTransactions);
    return tipWithdrawnTransactions;
  },
  async fetchTransactions({
    state, getters, dispatch, commit,
  }, { limit, recent }) {
    if (!state.middleware || (state.transactions.nextPageUrl === null && !recent)) return;
    const { address } = getters.account;
    let txs = await Promise.all([
      (recent || state.transactions.nextPageUrl === ''
        ? state.middleware.getTxByAccount(address, limit, 1)
        : fetchJson(`${getters.activeNetwork.middlewareUrl}${state.transactions.nextPageUrl}`))
        .then(({ data, next }) => {
          const result = recent || state.transactions.nextPageUrl === '' ? data : camelcaseKeysDeep(data);
          if (!recent) commit('setTransactionsNextPage', next);
          return result;
        })
        .catch(() => []),
      dispatch('fetchPendingTransactions', address),
    ]);
    console.log({ txs });
    const minMicroTime = Math.min.apply(null, flatten(txs).map((tx) => tx.microTime));
    const amountOfTx = flatten(txs).length;
    flatten(await Promise.all([dispatch('fungibleTokens/getTokensHistory', recent),
      dispatch('fetchTipWithdrawnTransactions', recent)]))
      .forEach((f) => {
        if (minMicroTime < f.microTime || (amountOfTx === 0 && minMicroTime > f.microTime)) {
          txs[0].push(f);
        }
      });
    txs = orderBy(flatten(txs), ['microTime'], ['desc']);
    const network = getters.activeNetwork.networkId;
    if (state.transactions.pending[network]) {
      state.transactions.pending[network].forEach(({ hash }) => {
        if (txs.some((tx) => tx.hash === hash && !tx.pending)) {
          commit('removePendingTransactionByHash', { hash, network });
        }
      });
    }
    console.log(1, txs);
    commit('addTransactions', recent ? txs.slice(0, limit) : txs);
  },
  pollCurrencies({ commit }) {
    return executeAndSetInterval(async () => {
      try {
        const { aeternity } = await fetchJson(CURRENCIES_URL);
        commit('setCurrencies', aeternity);
      } catch (e) {
        handleUnknownError(e);
      }
    }, 3600000);
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
    { getters: { activeNetwork, 'sdkPlugin/sdk': sdk } },
    [tipId, text, author, parentId],
  ) {
    const sendComment = async (postParam) => postJson(`${activeNetwork.backendUrl}/comment/api/`, { body: postParam });

    const responseChallenge = await sendComment({
      tipId, text, author, parentId,
    });
    const respondChallenge = await fetchRespondChallenge(sdk, responseChallenge);

    return sendComment(respondChallenge);
  },
  async getCacheChainNames({ getters: { activeNetwork } }) {
    return fetchJson(`${activeNetwork.backendUrl}/cache/chainnames`);
  },
  async getCacheTip({ getters: { activeNetwork } }, id) {
    return fetchJson(`${activeNetwork.backendUrl}/tips/single/${id}`);
  },
  async initTippingContractInstances({
    getters: { 'sdkPlugin/sdk': sdk, activeNetwork, tippingSupported },
    commit,
  }) {
    if (!tippingSupported && !process.env.RUNNING_IN_TESTS) return;

    const [
      contractInstanceV1,
      contractInstanceV2,
    ] = await Promise.all([
      sdk.getContractInstance({
        source: TIPPING_V1_INTERFACE,
        contractAddress: activeNetwork.tipContractV1,
      }),
      activeNetwork.tipContractV2
        ? sdk.getContractInstance({
          source: TIPPING_V2_INTERFACE,
          contractAddress: activeNetwork.tipContractV2,
        })
        : null,
    ]);

    commit('setTipping', [contractInstanceV1, contractInstanceV2]);
  },
  async share(_, options) {
    await (process.env.IS_CORDOVA
      ? new Promise((resolve) => window.plugins.socialsharing.shareW3C(
        options,
        ({ app }) => app && resolve(),
      ))
      : navigator.share(options));
  },
};
