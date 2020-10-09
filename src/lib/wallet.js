import { Node, MemoryAccount, RpcWallet } from '@aeternity/aepp-sdk/es';
import Swagger from '@aeternity/aepp-sdk/es/utils/swagger';
import { BrowserWindowMessageConnection } from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message';
import { isEmpty, times } from 'lodash-es';
import store from '../store';
import { postMessage } from '../popup/utils/connection';
import {
  parseFromStorage,
  fetchJson,
  IN_FRAME,
  toURL,
  getAeppAccountPermission,
} from '../popup/utils/helper';
import { TIPPING_CONTRACT, NO_POPUP_AEPPS } from '../popup/utils/constants';
import Logger from './logger';
import { checkPermissions } from '../store/modules/permissions';

async function initMiddleware() {
  const { middlewareUrl } = store.getters.activeNetwork;
  const swag = await fetchJson(`${middlewareUrl}/middleware/api`);
  swag.paths['/names/auctions/{name}/info'] = {
    get: {
      operationId: 'getAuctionInfoByName',
      parameters: [
        {
          in: 'path',
          name: 'name',
          required: true,
          type: 'string',
        },
      ],
    },
  };
  const { api: middleware } = await Swagger.compose({
    methods: {
      urlFor: path => middlewareUrl + path,
      axiosError: () => '',
    },
  })({ swag });
  store.commit('setMiddleware', middleware);
  store.dispatch('names/fetchOwned');
  store.dispatch('names/extendNames');
}

async function logout() {
  store.commit('setActiveAccount', { publicKey: '', index: 0 });
  store.commit('updateAccount', {});
  store.commit('switchLoggedIn', false);
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
    'setTipping',
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
      store.commit('setMainLoading', false);
      return { loggedIn: false };
    }
    const address = await store.dispatch('generateWallet', { seed: account.privateKey });
    store.commit('updateAccount', account);
    store.commit('setActiveAccount', { publicKey: address, index: 0 });

    store.commit('switchLoggedIn', true);

    store.commit('setMainLoading', false);
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

    const { activeNetwork } = store.getters;
    const { internalUrl, compilerUrl } = activeNetwork;
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
        nodes: [{ name: activeNetwork.name, instance: node }],
        accounts: [account],
        nativeMode: true,
        compilerUrl,
        name: 'Superhero',
        async onConnection({ info: { icons, name } }, action, origin) {
          const originUrl = toURL(origin);
          if (
            (NO_POPUP_AEPPS.includes(originUrl.hostname) ||
              (await getAeppAccountPermission(
                originUrl.hostname,
                store.state.account.publicKey,
              ))) &&
            !(await checkPermissions(action))
          ) {
            action.accept();
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
            action.accept();
          } catch (error) {
            action.deny();
            if (error.message !== 'Rejected by user') throw error;
          }
        },
        onSubscription: acceptCb,
        onSign: acceptCb,
        async onMessageSign(aepp, action, origin) {
          if (!(await checkPermissions(action))) {
            action.accept();
            return;
          }
          try {
            await store.dispatch('modals/open', {
              name: 'confirm-message-sign',
              message: action.params.message,
              origin,
            });
            action.accept();
          } catch (error) {
            action.deny();
            if (error.message !== 'Rejected by user') throw error;
          }
        },
        onAskAccounts: acceptCb,
        onDisconnect(msg, client) {
          client.disconnect();
        },
      });

      if (IN_FRAME) {
        const getArrayOfAvailableFrames = () => [
          window.parent,
          ...times(window.parent.frames.length, i => window.parent.frames[i]),
        ];
        const executeAndSetInterval = (handler, timeout) => {
          handler();
          return setInterval(handler, timeout);
        };

        const connectedFrames = new Set();
        executeAndSetInterval(
          () =>
            getArrayOfAvailableFrames()
              .filter(frame => frame !== window)
              .forEach(target => {
                if (connectedFrames.has(target)) return;
                connectedFrames.add(target);
                const connection = BrowserWindowMessageConnection({ target });
                const originalConnect = connection.connect;
                let intervalId;
                connection.connect = function connect(onMessage) {
                  originalConnect.call(this, (data, origin, source) => {
                    if (source !== target) return;
                    clearInterval(intervalId);
                    onMessage(data, origin, source);
                  });
                };
                sdk.addRpcClient(connection);
                intervalId = executeAndSetInterval(() => {
                  if (!getArrayOfAvailableFrames().includes(target)) {
                    clearInterval(intervalId);
                    return;
                  }
                  sdk.shareWalletInfo(connection.sendMessage.bind(connection));
                }, 3000);
              }),
          3000,
        );
      }

      await store.commit('initSdk', sdk);
      await initContractInstances();
      await initMiddleware();
      store.commit('setNodeStatus', 'connected');
      setTimeout(() => store.commit('setNodeStatus', ''), 2000);
    } catch (e) {
      store.commit('setNodeStatus', 'error');
      Logger.write(e);
    } finally {
      initSdkRunning = false;
    }
  },
};
