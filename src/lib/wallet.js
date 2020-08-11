import { Node, MemoryAccount, RpcWallet } from '@aeternity/aepp-sdk/es';
import { BrowserWindowMessageConnection } from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message';
import { isEmpty, times } from 'lodash-es';
import store from '../store';
import { postMessage } from '../popup/utils/connection';
import {
  parseFromStorage,
  middleware,
  getAllNetworks,
  IN_FRAME,
  toURL,
  getAeppAccountPermission,
} from '../popup/utils/helper';
import { TIPPING_CONTRACT, NO_POPUP_AEPPS } from '../popup/utils/constants';
import Logger from './logger';

async function initMiddleware() {
  const { network, current } = store.state;
  store.commit('SET_MIDDLEWARE', (await middleware(network, current)).api);
  store.dispatch('names/fetchOwned');
}

async function logout() {
  store.commit('SET_ACTIVE_ACCOUNT', { publicKey: '', index: 0 });
  store.commit('UPDATE_ACCOUNT', {});
  store.commit('SWITCH_LOGGED_IN', false);
}

async function getKeyPair() {
  const { activeAccount } = store.state;
  const { account } = store.getters;
  const res = await postMessage({ type: 'getKeypair', payload: { activeAccount, account } });
  return res.error ? { error: true } : parseFromStorage(res);
}

async function initContractInstances() {
  if (!store.getters.mainnet && !process.env.RUNNING_IN_TESTS) return;
  const contractAddress = await store.dispatch('getTipContractAddress');
  store.commit(
    'SET_TIPPING',
    await store.state.sdk.getContractInstance(TIPPING_CONTRACT, {
      contractAddress,
      forceCodeCheck: true,
    }),
  );
}

let initSdkRunning = false;

export default {
  async init() {
    const { account } = store.getters;
    if (isEmpty(account)) {
      store.commit('SET_MAIN_LOADING', false);
      return { loggedIn: false };
    }
    const address = await store.dispatch('generateWallet', { seed: account.privateKey });
    store.commit('UPDATE_ACCOUNT', account);
    store.commit('SET_ACTIVE_ACCOUNT', { publicKey: address, index: 0 });

    store.commit('SWITCH_LOGGED_IN', true);

    /* Get network */
    const networks = await getAllNetworks();
    store.commit('SET_NETWORKS', networks);

    store.commit('SET_MAIN_LOADING', false);
    return { loggedIn: true };
  },
  async initSdk() {
    if (initSdkRunning) return;
    initSdkRunning = true;
    const keypair = await getKeyPair();
    if (keypair.error) {
      await logout();
      return;
    }

    const { network, current } = store.state;
    const { internalUrl, compilerUrl } = network[current.network];
    const node = await Node({
      url: internalUrl,
      internalUrl,
    });
    const account = MemoryAccount({ keypair });
    try {
      const acceptCb = (_, { accept }) => accept();
      const sdk = await RpcWallet.compose({
        methods: {
          address: async () => store.getters.account.publicKey,
          sign: data => store.dispatch('accounts/sign', data),
          signTransaction: (txBase64, opt) =>
            store.dispatch('accounts/signTransaction', { txBase64, opt }),
        },
      })({
        nodes: [{ name: current.network, instance: node }],
        accounts: [account],
        nativeMode: true,
        compilerUrl,
        name: 'Superhero',
        async onConnection({ info: { icons, name } }, { accept, deny }, origin) {
          const originUrl = toURL(origin);
          if (
            NO_POPUP_AEPPS.includes(originUrl.hostname) ||
            (await getAeppAccountPermission(originUrl.hostname, store.state.account.publicKey))
          ) {
            accept();
            return;
          }
          try {
            await store.dispatch('modals/open', {
              name: 'confirm-connect',
              app: {
                name,
                icons,
                protocol: originUrl.protocol,
                host: originUrl.hostname,
              },
            });
            await store.dispatch('setPermissionForAccount', {
              host: originUrl.hostname,
              account: store.state.account.publicKey,
            });
            accept();
          } catch (error) {
            deny();
            if (error.message !== 'Rejected by user') throw error;
          }
        },
        onSubscription: acceptCb,
        onSign: acceptCb,
        onMessageSign: acceptCb,
        onAskAccounts: acceptCb,
        onDisconnect(msg, client) {
          client.disconnect();
        },
      });

      if (IN_FRAME) {
        const connectedFrames = new Set();
        const connectToFrame = target => {
          if (connectedFrames.has(target)) return;
          connectedFrames.add(target);
          const connection = BrowserWindowMessageConnection({ target });
          const originalConnect = connection.connect;
          connection.connect = function connect(onMessage) {
            originalConnect.call(this, (data, origin, source) => {
              if (source !== target) return;
              onMessage(data, origin, source);
            });
          };
          sdk.addRpcClient(connection);
          sdk.shareWalletInfo(connection.sendMessage.bind(connection));
          setTimeout(() => sdk.shareWalletInfo(connection.sendMessage.bind(connection)), 3000);
        };

        connectToFrame(window.parent);
        const connectToParentFrames = () =>
          times(window.parent.frames.length, i => window.parent.frames[i])
            .filter(frame => frame !== window)
            .forEach(connectToFrame);
        connectToParentFrames();
        setInterval(connectToParentFrames, 3000);
      }

      await store.dispatch('initSdk', sdk);
      await initContractInstances();
      await initMiddleware();
      store.commit('SET_NODE_STATUS', 'connected');
      setTimeout(() => store.commit('SET_NODE_STATUS', ''), 2000);
    } catch (e) {
      store.commit('SET_NODE_STATUS', 'error');
      Logger.write(e);
    } finally {
      initSdkRunning = false;
    }
  },
};
