import { uniqBy, flatten } from 'lodash-es';
import * as types from './mutation-types';
import * as popupMessages from '../popup/utils/popup-messages';
import { convertToAE, stringifyForStorage, parseFromStorage } from '../popup/utils/helper';
import { TIP_SERVICE } from '../popup/utils/constants';
import router from '../popup/router/index';
import { postMessage } from '../popup/utils/connection';

export default {
  setAccount({ commit }, payload) {
    commit(types.UPDATE_ACCOUNT, payload);
    commit(types.UPDATE_BALANCE);
  },
  setSubAccount({ commit }, payload) {
    commit(types.SET_SUBACCOUNT, payload);
  },
  setSubAccounts({ commit }, payload) {
    commit(types.SET_SUBACCOUNTS, payload);
  },
  switchNetwork({ commit }, payload) {
    browser.storage.local.set({ activeNetwork: payload });
    return new Promise((resolve, reject) => {
      commit(types.SWITCH_NETWORK, payload);
      resolve();
    });
  },
  async updateBalance({ commit, state }) {
    const balance = await state.sdk.balance(state.account.publicKey).catch(() => 0);
    await browser.storage.local.set({ tokenBal: convertToAE(balance).toFixed(3) });
    commit(types.UPDATE_BALANCE, convertToAE(balance));
  },
  popupAlert({ commit }, payload) {
    switch (payload.name) {
      case 'spend':
        switch (payload.type) {
          case 'insufficient_balance':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.INSUFFICIENT_BALANCE });
            break;
          case 'confirm_transaction':
            commit(types.SHOW_POPUP, {
              show: true,
              class: payload.type,
              data: payload.data,
              secondBtn: true,
              secondBtnClick: 'confirmTransaction',
              ...popupMessages.CONFIRM_TRANSACTION,
            });
            break;
          case 'success_transfer':
            commit(types.SHOW_POPUP, { show: true, secondBtn: true, secondBtnClick: 'showTransaction', ...popupMessages.SUCCESS_TRANSFER, msg: payload.msg, data: payload.data });
            break;
          case 'success_deploy':
            commit(types.SHOW_POPUP, {
              show: true,
              secondBtn: true,
              secondBtnClick: 'copyAddress',
              buttonsTextSecondary: 'Copy address',
              ...popupMessages.SUCCESS_DEPLOY,
              msg: payload.msg,
              data: payload.data,
              noRedirect: payload.noRedirect,
            });
            break;
          case 'incorrect_address':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.INCORRECT_ADDRESS });
            break;
          case 'tx_limit_per_day':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.TX_LIMIT_PER_DAY });
            break;
          case 'incorrect_amount':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.INCORRECT_AMOUNT });
            break;
          case 'transaction_failed':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.TRANSACTION_FAILED });
            break;
          case 'integer_required':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.INTEGER_REQUIRED });
            break;
          default:
            break;
        }
        break;
      case 'account':
        switch (payload.type) {
          case 'publicKeyCopied':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.PUBLIC_KEY_COPIED });
            break;
          case 'seedFastCopy':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.SEED_FAST_COPY });
            break;
          case 'requiredField':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.REQUIRED_FIELD });
            break;
          case 'added_success':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.SUCCESS_ADDED });
            break;
          case 'only_allowed_chars':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.CHARS_ALLOWED });
            break;
          case 'not_selected_val':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.NOT_SELECTED_VAL });
            break;
          case 'account_already_exist':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.ACCOUNT_ALREADY_EXIST });
            break;
          case 'invalid_number':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.REQUIRED_NUMBER });
            break;
          case 'airgap_created':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.AIRGAP_CREATED });
            break;
          case 'confirm_privacy_clear':
            commit(types.SHOW_POPUP, { show: true, secondBtn: true, secondBtnClick: 'clearPrivacyData', ...popupMessages.CONFIRM_PRIVACY_CLEAR });
            break;
          case 'ledger_support':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.LEDGER_SUPPORT });
            break;
          case 'ledger_account_error':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.LEDGER_ACCOUNT_ERROR });
            break;
          case 'reveal_seed_phrase_impossible':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.REVEAL_SEED_IMPOSSIBLE });
            break;
          case 'error_qrcode':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.ERROR_QRCODE, msg: payload.msg, data: payload.data });
            break;
          case 'tip_url_verified':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.TIP_URL_VERIFIED });
            break;
          default:
            break;
        }
        break;
      case 'network':
        switch (payload.type) {
          case 'confirm_remove':
            commit(types.SHOW_POPUP, {
              show: true,
              class: payload.type,
              data: payload.data,
              secondBtn: true,
              secondBtnClick: 'removeUserNetwork',
              ...popupMessages.REMOVE_USER_NETWORK,
            });
            break;
          case 'cannot_remove':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.REMOVE_USER_NETWORK_ACTIVE_ERROR });
            break;
          case 'name_exists':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.USER_NETWORK_EXISTS_ERROR });
            break;
        }
        break;
      default:
        break;
    }
  },
  getTransactionsByPublicKey({ state }, payload) {
    const { middlewareUrl } = state.network[state.current.network];
    let limit = '';
    let page = '';
    let param = '';
    const account = payload.publicKey;
    if (payload.limit) {
      limit = `?limit=${payload.limit}`;
    }
    if (payload.page) {
      page = `&page=${payload.page}`;
    }
    if (payload.param) {
      param = `/${payload.param}`;
    }
    return fetch(`${middlewareUrl}/middleware/transactions/account/${account}${limit}${page}${param}`, {
      method: 'GET',
      mode: 'cors',
    }).then(res => res.json());
  },
  updateLatestTransactions({ commit }, payload) {
    commit(types.UPDATE_LATEST_TRANSACTIONS, payload);
  },
  updateAllTransactions({ commit }, payload) {
    commit(types.UPDATE_ALL_TRANSACTIONS, payload);
  },
  setAccountName({ commit }, payload) {
    commit(types.SET_ACCOUNT_NAME, payload);
  },
  initSdk({ commit }, payload) {
    commit(types.INIT_SDK, payload);
  },
  async getRegisteredNames({ commit, state }) {
    const { middlewareUrl } = state.network[state.current.network];
    const res = await Promise.all(
      state.subaccounts.map(async ({ publicKey }, index) => {
        if (publicKey) {
          let names = await Promise.all([
            (async () =>
              (await state.sdk.api.getPendingAccountTransactionsByPubkey(publicKey).catch(() => ({ transactions: [] }))).transactions
                .filter(({ tx: { type } }) => type === 'NameClaimTx')
                .map(({ tx, ...otherTx }) => ({
                  ...otherTx,
                  ...tx,
                  pending: true,
                  owner: tx.accountId,
                })))(),
            (async () => uniqBy(await (await fetch(`${middlewareUrl}/middleware/names/reverse/${publicKey}`)).json(), 'name'))(),
            (async () => {
              try {
                return await state.sdk.middleware.getActiveNames({ owner: publicKey });
              } catch (e) {}
              return [];
            })(),
          ]);
          names = flatten(names);
          names = uniqBy(names, 'name');
          if (names.length) {
            commit(types.SET_ACCOUNT_AENS, { account: index, aename: names[0].name, pending: !!names[0].pending });
          } else {
            commit(types.SET_ACCOUNT_AENS, { account: index, aename: null, pending: false });
          }
          return names;
        }
        return [];
      })
    );
    await browser.storage.local.set({ subaccounts: state.subaccounts.filter(s => s.publicKey) });
    commit(types.SET_NAMES, { names: Array.prototype.concat.apply([], res) });
  },
  async removePendingName({ commit, state }, { hash }) {
    let pending = state.pendingNames;
    pending = pending.filter(p => p.hash !== hash);
    await browser.storage.local.set({ pendingNames: { list: pending } });
    commit(types.SET_PENDING_NAMES, { names: pending });
    await new Promise(resolve => setTimeout(resolve, 1500));
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
      })
    );
    return { publicKey, secretKey };
  },

  async generateWallet(context, { seed }) {
    return (await postMessage({ type: 'generateWallet', payload: { seed: stringifyForStorage(seed) } })).address;
  },

  async setLogin({ commit, dispatch }, { keypair }) {
    await browser.storage.local.set({ userAccount: keypair, isLogged: true, termsAgreed: true });

    const sub = [];
    sub.push({
      name: 'Main Account',
      publicKey: keypair.publicKey,
      balance: 0,
      root: true,
      aename: null,
    });
    await browser.storage.local.set({ subaccounts: sub, activeAccount: 0 });
    commit('SET_ACTIVE_ACCOUNT', { publicKey: keypair.publicKey, index: 0 });
    await dispatch('setSubAccounts', sub);
    commit('UPDATE_ACCOUNT', keypair);
    commit('SWITCH_LOGGED_IN', true);
    // router.push('/account');
  },
  async getPendingTxs({ state: { current }, commit }) {
    const { pendingTxs } = await browser.storage.local.get('pendingTxs');
    let txs = [];
    if (pendingTxs && pendingTxs.length) {
      txs = pendingTxs.map(el => {
        if (el.domain) el.domain = el.domain;
        el.amount = parseFloat(el.amount).toFixed(3);
        el.time = el.time;
        el.amountCurrency = parseFloat(current.currencyRate ? el.amount * current.currencyRate : el.amount).toFixed(3);
        return el;
      });
    }
    commit('SET_PENDING_TXS', txs);
  },
  async checkPendingTxMined({ commit, state: { sdk } }) {
    const { pendingTxs } = await browser.storage.local.get('pendingTxs');
    if (pendingTxs && pendingTxs.length) {
      pendingTxs.forEach(async ({ hash, type, amount, domain }) => {
        const mined = await sdk.poll(hash);
        if (mined) {
          const pending = pendingTxs.filter(p => p.hash !== hash);
          browser.storage.local.set({ pendingTxs: pending });
          commit('SET_PENDING_TXS', pending);
          if (type === 'tip') {
            return router.push({ name: 'success-tip', params: { amount, domain } });
          }
          if (type === 'spend') {
            return router.push({ name: 'send', params: { redirectstep: 3, successtx: mined } });
          }
        }
      });
    }
  },
  async checkExtensionUpdate({ state: { network, current } }) {
    const { tipContract } = network[current.network];
    let update = false;
    try {
      const latestContract = await (await fetch(`${TIP_SERVICE}/tip-contract`)).json();
      if (tipContract !== latestContract) update = true;
    } catch (e) {
      update = false;
    }

    return update;
  },
  async checkBackupSeed() {
    const { backed_up_Seed } = await browser.storage.local.get('backed_up_Seed');
    if (!backed_up_Seed) return false;

    return true;
  },
};
