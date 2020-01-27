import Ae from '@aeternity/aepp-sdk/es/ae/universal';
import * as types from './mutation-types';
import * as popupMessages from '../popup/utils/popup-messages';
import { convertToAE, stringifyForStorage, parseFromStorage, contractCall, checkContractAbiVersion } from '../popup/utils/helper';
import { FUNGIBLE_TOKEN_CONTRACT } from '../popup/utils/constants';
import { uniqBy, head, flatten, merge, uniqWith, isEqual } from 'lodash-es';
import router from '../popup/router/index'
import Ledger from '../popup/utils/ledger/ledger';
import { derivePasswordKey, genRandomBuffer } from '../popup/utils/hdWallet'
import AES from '../popup/utils/aes';
import { postMesssage } from '../popup/utils/connection';
import { getKeyPair } from '@aeternity/hd-wallet/src/hd-key';

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
  updateBalance({ commit, state }) {
    // get balance based on new or already fetched api
    state.sdk.balance(state.account.publicKey)
      .then(balance => {
        commit(types.UPDATE_BALANCE, convertToAE(balance));
      })
      .catch(e => {
        commit(types.UPDATE_BALANCE, convertToAE(0));
      });
  },
  updateBalanceSubaccounts({ commit, state }) {
    state.subaccounts.forEach((sub, index) => {
      state.sdk.balance(sub.publicKey)
        .then(balance => {
          commit(types.UPDATE_SUBACCOUNTS_BALANCE, { account: index, balance: convertToAE(balance) });
        })
        .catch(e => {
          commit(types.UPDATE_SUBACCOUNTS_BALANCE, { account: index, balance: convertToAE(0) });
        });
    });
  },
  updateBalanceTokens({ commit, state }) {
    state.tokens.forEach((tkn, index) => {
      if (typeof tkn.parent != 'undefined' && tkn.contract != '' && tkn.parent == state.account.publicKey) {
        state.sdk.contractCallStatic(FUNGIBLE_TOKEN_CONTRACT, tkn.contract, 'balance', [state.account.publicKey])
          .then((res) => {
            res.decode()
              .then(balance => {
                commit(types.UPDATE_TOKENS_BALANCE, { token: index, balance: balance == 'None' ? 0 : balance.Some[0] });
              })
          })
          .catch(e => {

          })
      }
    })
  },
  updateBalanceToken({ commit, state }) {
    state.sdk.contractCallStatic(FUNGIBLE_TOKEN_CONTRACT, state.tokens[state.current.token].contract, 'balance', [state.account.publicKey])
      .then((res) => {
        res.decode()
          .then(balance => {
            commit(types.UPDATE_TOKENS_BALANCE, { token: state.current.token, balance: balance == 'None' ? 0 : balance.Some[0] });
          })
      })
      .catch(e => {

      })
  },
  popupAlert({ commit, state }, payload) {
    switch (payload.name) {
      case 'spend':
        switch (payload.type) {
          case 'insufficient_balance':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.INSUFFICIENT_BALANCE });
            break;
          case 'confirm_transaction':
            commit(types.SHOW_POPUP, { show: true, class: payload.type, data: payload.data, secondBtn: true, secondBtnClick: 'confirmTransaction', ...popupMessages.CONFIRM_TRANSACTION });
            break;
          case 'success_transfer':
            commit(types.SHOW_POPUP, { show: true, secondBtn: true, secondBtnClick: 'showTransaction', ...popupMessages.SUCCESS_TRANSFER, msg: payload.msg, data: payload.data })
            break;
          case 'success_deploy':
            commit(types.SHOW_POPUP, { show: true,  secondBtn: true, secondBtnClick: 'copyAddress', buttonsTextSecondary:'Copy address', ...popupMessages.SUCCESS_DEPLOY, msg: payload.msg,data: payload.data, noRedirect:payload.noRedirect })
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
          case 'token_add':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.INCORRECT_FIELDS_ADD_TOKEN });
            break;
          case 'token_exists':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.TOKEN_ADDED });
            break;
          case 'token_invalid_address':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.TOKEN_INVALID_ADDRESS });
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
            commit(types.SHOW_POPUP, { show: true, secondBtn: true, secondBtnClick: 'clearPrivacyData', ...popupMessages.CONFIRM_PRIVACY_CLEAR })
            break;
          case 'name_exist':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.AENS_NAME_EXIST })
            break;
          case 'ledger_support':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.LEDGER_SUPPORT })
            break
          case 'ledger_account_error':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.LEDGER_ACCOUNT_ERROR })
            break
          case 'signedMessage':
            commit(types.SHOW_POPUP, { show: true, secondBtn: true, secondBtnClick: 'copyText', ...popupMessages.SIGNED_MESSAGE, msg: payload.msg, data: payload.data })
            break
          case 'success_verifymessage':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.SUCCESS_VERIFYMESSAGE })
            break
          case 'unsuccess_verifymessage':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.UNSUCCESS_VERIFYMESSAGE })
            break
          case 'token_migration_error':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.TOKEN_MIGRATION_ERROR })
            break
          case 'token_migration_success':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.TOKEN_MIGRATION })
            break
          case 'reveal_seed_phrase_impossible':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.REVEAL_SEED_IMPOSSIBLE })
            break;
          default:
            break;
        }
        break;
      case 'fungible_token':
        switch (payload.type) {
          case 'balance_account_not_existent':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.BALANCE_ACCOUNT_NOT_EXISTENT });
            break;
          case 'allowance_change_success':
            commit(types.SHOW_POPUP, { show: true, ...popupMessages.ALLOWANCE_CHANGE_SUCCESS });
            break;
          default:
            break;
        }
        break;
      case 'network':
        switch (payload.type) {
          case 'confirm_remove':
            commit(types.SHOW_POPUP, { show: true, class: payload.type, data: payload.data, secondBtn: true, secondBtnClick: 'removeUserNetwork', ...popupMessages.REMOVE_USER_NETWORK });
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
  getTransactionsByPublicKey({ commit, state }, payload) {
    const middlewareUrl = state.network[state.current.network].middlewareUrl;
    let limit = "", page = "", param = "";
    let account = payload.publicKey;
    if (payload.limit) {
      limit = "?limit=" + payload.limit;
    }
    if (payload.page) {
      page = "&page=" + payload.page;
    }
    if (payload.param) {
      param = "/" + payload.param;
    }
    return fetch(middlewareUrl + "/middleware/transactions/account/" + account + limit + page + param, {
      method: 'GET',
      mode: 'cors'
    })
      .then(res => res.json())
      .catch(err => err);
  },
  updateLatestTransactions({ commit }, payload) {
    commit(types.UPDATE_LATEST_TRANSACTIONS, payload);
  },
  updateAllTransactions({ commit, state }, payload) {
    commit(types.UPDATE_ALL_TRANSACTIONS, payload);
  },
  setAccountName({ commit, state }, payload) {
    commit(types.SET_ACCOUNT_NAME, payload);
  },
  setUserNetwork({ commit }, payload) {
    commit(types.SET_USERNETWORK, payload);
  },
  setUserNetworks({ commit }, payload) {
    commit(types.SET_USERNETWORKS, payload);
  },
  initSdk({ commit }, payload) {
    commit(types.INIT_SDK, payload)
  },
  setTokens({ commit }, payload) {
    commit(types.SET_TOKENS, payload)
  },
  async getRegisteredNames({ commit, state }) {
    const middlewareUrl = state.network[state.current.network].middlewareUrl;

    let res = await Promise.all(state.subaccounts.map(async ({ publicKey }, index) => {
      let names = (await Promise.all([
        (async () => {
          return (await state.sdk.api.getPendingAccountTransactionsByPubkey(publicKey)
            .catch(() => ({ transactions: [] })))
            .transactions
            .filter(({ tx: { type } }) => type === 'NameClaimTx')
            .map(({ tx, ...otherTx }) => ({
              ...otherTx,
              ...tx,
              pending: true,
              owner: tx.accountId,
            }));
        })(),
        (async () => uniqBy(
          await (await fetch(
            `${middlewareUrl}/middleware/names/reverse/${publicKey}`,
          )).json(),
          'name',
        ))(),
        (
          async () => {
            try {
              return await state.sdk.middleware.getActiveNames({ owner: publicKey })
            } catch(e) {
              
            }
            return []
          }
        )()
      ]))
      
      names = flatten(names)
      names = uniqBy(names, 'name')
      if (names.length) commit(types.SET_ACCOUNT_AENS, { account: index, name: names[0].name, pending: names[0].pending ? true : false })
      browser.storage.local.get('pendingNames').then(pNames => {
        let pending = []
        if (pNames.hasOwnProperty("pendingNames") && pNames.pendingNames.hasOwnProperty('list')) {
          pending = pNames.pendingNames.list
        }
        names.filter(n => n.pending).forEach(n => {
          if (typeof pending.find(p => p.name == n.name) == 'undefined') {
            pending.push(n)
          }
        })

        if (pending.length) {
          browser.storage.local.set({ pendingNames: { list: pending } })
          commit(types.SET_PENDING_NAMES, { names: pending })
        }
      })
      return names;
    }))

    commit(types.SET_NAMES, { names: Array.prototype.concat.apply([], res) })
  },
  async updateRegisteredName({ commit, state }) {
    let pending = uniqBy(state.pendingNames, 'hash')
    return new Promise(async (resolve, reject) => {
      if (pending.length) {
        let { hash, name } = head(pending)
        let register = await state.sdk.poll(hash)
        let claim = await state.sdk.aensQuery(name)
        let tx = {
          popup: false,
          tx: {
            name,
            recipientId: '',
            claim,
            hash
          },
          type: 'nameUpdate'
        }
        commit('SET_AEPP_POPUP', true)
        resolve(register)
        router.push({
          'name': 'sign', params: {
            data: tx,
            type: tx.type
          }
        })
      } else {
        resolve()
      }
    })
  },
  removePendingName({ commit, state }, { hash }) {
    return new Promise((resolve, reject) => {
      let pending = state.pendingNames
      pending = pending.filter(p => p.hash != hash)
      browser.storage.local.set({ pendingNames: { list: pending } }).then(() => {
        commit(types.SET_PENDING_NAMES, { names: pending })
        setTimeout(() => {
          resolve()
        }, 1500)
      })
    })
  },

  async unlockHdWallet({ state, dispatch, commit }, { accountPassword, wallet }) {

    return new Promise(async (resolve, reject) => {
      browser.storage.local.get('encryptedWallet').then(async ({ encryptedWallet }) => {
        if (!encryptedWallet) {
          commit("SET_WALLET", wallet)
          await dispatch('encryptHdWallet', accountPassword)
          encryptedWallet = parseFromStorage(await dispatch('getEncryptedWallet'))
        } else {
          encryptedWallet = parseFromStorage(encryptedWallet)
        }

        commit('SET_ENCRYPTED_WALLET', encryptedWallet);
        try {
          const passwordDerivedKey = await dispatch('deriveAndCheckPasswordKey', accountPassword);
          const aes = new AES(passwordDerivedKey);

          let wallet = {
            privateKey: new Uint8Array(await aes.decrypt(encryptedWallet.privateKey)),
            chainCode: new Uint8Array(await aes.decrypt(encryptedWallet.chainCode)),
          }
          commit("SET_WALLET", wallet)

          browser.storage.local.set({ wallet: stringifyForStorage(wallet) }).then(() => {
            resolve()
          });
        } catch (err) {
          reject(err)
        }
      })
    })
  },

  async unlockWallet({ state: { background }, dispatch, commit }, payload) {
    return new Promise(async (resolve, reject) => {
      let msg = await postMesssage(background, { type: 'unlockWallet', payload })
      resolve(msg.res)
    })
  },

  async getAccount({ state: { background } }, { idx }) {
    return new Promise(async (resolve, reject) => {
      let { res: { address } } = await postMesssage(background, { type: 'getAccount', payload: { idx } })
      resolve(address)
    })
  },

  async getKeyPair({ state: { background, account } }, { idx }) {
    return new Promise(async (resolve, reject) => {

      let { res } = await postMesssage(background, { type: 'getKeypair', payload: { activeAccount: idx, account: { publicKey: account.publicKey } } })
      res = parseFromStorage(res)
      resolve({ publicKey: res.publicKey, secretKey: res.secretKey })
    })
  },

  async generateWallet({ state: { background } }, { seed }) {
    return new Promise(async (resolve, reject) => {
      let { res: { address } } = await postMesssage(background, { type: 'generateWallet', payload: { seed: stringifyForStorage(seed) } })
      resolve(address)
    })
  },

  async getEncryptedWallet() {
    return new Promise((resolve, reject) => {
      browser.storage.local.get('encryptedWallet').then(async ({ encryptedWallet }) => {
        resolve(encryptedWallet)
      });
    })
  },
  async encryptHdWallet({ commit, state: { wallet } }, password) {
    return new Promise(async (resolve, reject) => {
      const salt = genRandomBuffer(16)
      const passwordDerivedKey = await derivePasswordKey(password, salt)
      const aes = new AES(passwordDerivedKey);
      const encryptedWallet = {
        privateKey: await aes.encrypt(wallet.privateKey),
        chainCode: await aes.encrypt(wallet.chainCode),
        mac: await aes.encrypt(new Uint8Array(2)),
        salt
      }

      commit('SET_ENCRYPTED_WALLET', encryptedWallet);

      browser.storage.local.set({ encryptedWallet: stringifyForStorage(encryptedWallet) }).then(() => {
        browser.storage.local.set({ wallet: stringifyForStorage(wallet) }).then(() => {
          resolve()
        })
      });
    })

  },

  async deriveAndCheckPasswordKey({ state: { encryptedWallet } }, password) {
    const passwordDerivedKey = await derivePasswordKey(password, encryptedWallet.salt);
    const aes = new AES(passwordDerivedKey);
    await aes.decrypt(encryptedWallet.privateKey);
    await aes.decrypt(encryptedWallet.chainCode);
    const mac = new Uint8Array(await aes.decrypt(encryptedWallet.mac));
    if (mac.reduce((p, n) => p || n !== 0, false)) throw new Error('Wrong password');
    return passwordDerivedKey;
  },

  async getAllUserTokens({ state: { tokenRegistry, tokenRegistryLima, account, tokens, sdk, network, current }, dispatch }) {
    let { publicKey } = account
    let savedTokens = await browser.storage.local.get('tokens')
    
    if(savedTokens.hasOwnProperty("tokens")) {
      dispatch('setTokens', savedTokens.tokens)
    }
    try {
      let tkns = (await contractCall({ instance:tokenRegistry, method:'get_all_tokens' })).decodedResult
      let tknsLima = (await contractCall({ instance:tokenRegistryLima, method:'get_all_tokens' })).decodedResult
      let res = (await Promise.all(uniqWith(tkns.concat(tknsLima), isEqual).map(async ( tkn ) => { 
        let instance = tokenRegistry
        if(await checkContractAbiVersion({ address: tkn[0], middleware: network[current.network].middlewareUrl }) == 3) {
          instance= tokenRegistryLima
        }
        // console.log(instance)
        let balance = (await contractCall({ instance, method:'get_token_balance', params: [tkn[0], publicKey] })).decodedResult
        let owner = (await contractCall({ instance, method:'get_token_owner', params: [tkn[0]] })).decodedResult
        let token
        if(typeof balance != 'undefined' || owner == publicKey) {
          token = {
            balance,
            parent: publicKey,
            contract: tkn[0],
            name: tkn[1].name,
            symbol:tkn[1].symbol,
            precision:tkn[1].decimals
          }
        } 
        return token
        // console.log(tokens)
      }))).filter(t => typeof t != 'undefined')
      
      res = tokens.concat(res)
      let userTokens = res
      
      if(savedTokens.hasOwnProperty("tokens")) {
        userTokens = savedTokens.tokens.concat(res)
      } 
      userTokens = uniqBy(userTokens, (elem) => ( [elem.contract, elem.parent].join() ))
      dispatch('setTokens', userTokens)
    } catch(e){
      console.log(e)
    }
  },

  ...Ledger
};
