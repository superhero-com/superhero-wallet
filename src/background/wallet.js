import { RpcWallet, Crypto, Node } from '@aeternity/aepp-sdk';
import BrowserRuntimeConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime';
import { isEmpty, isEqual } from 'lodash-es';
import uuid from 'uuid';
import { CONNECTION_TYPES } from '../popup/utils/constants';
import { detectConnectionType } from '../popup/utils/helper';
import store from './store';
import { App } from '../store/modules/permissions';

window.browser = require('webextension-polyfill');

let sdk;
let connectionsQueue = [];
const popups = {};
const getAeppUrl = (v) => new URL(v.connection.port.sender.url);

const showPopup = async (aepp, type, params) => {
  const id = uuid();
  const { href, protocol, host } = typeof aepp === 'object' ? getAeppUrl(aepp) : new URL(aepp);
  const tabs = await browser.tabs.query({ active: true });
  tabs.forEach(({ url: tabURL, id: tabId }) => {
    const tabUrl = new URL(tabURL);
    if (
      tabUrl.searchParams.get('type') === 'connectConfirm'
      && decodeURIComponent(tabUrl.searchParams.get('url')) === href
    ) {
      browser.tabs.remove(tabId);
    }
  });

  const extUrl = browser.runtime.getURL('./index.html');
  const popupUrl = `${extUrl}?id=${id}&type=${type}&url=${encodeURIComponent(href)}`;
  const popupWindow = await browser.windows.create({
    url: popupUrl,
    type: 'popup',
    height: 600,
    width: 375,
  });

  return new Promise((resolve, reject) => {
    if (!popupWindow) reject();
    popups[id] = {
      actions: { resolve, reject },
      props: {
        app: {
          url: href,
          icons: aepp?.icons || [],
          name: aepp?.name || host,
          protocol,
          host,
        },
        ...(params?.message && { message: params.message }),
        ...(params?.txObject && { transaction: params.txObject.params }),
      },
    };
  });
};

const cbAccept = (_, { accept }) => accept();
const signCb = async (type, aepp, action) => {
  const { method, params } = action;
  if (
    (await store.dispatch('permissions/checkPermissions', {
      host: getAeppUrl(aepp).hostname,
      method,
      params: params?.txObject?.params,
    }))
    || (await showPopup(aepp, type, params).then(
      () => true,
      () => false,
    ))
  ) {
    action.accept.apply(null, [
      ...(method === 'message.sign' ? [] : [null]),
      { onAccount: { sign: () => {}, address: () => {} } },
    ]);
    return;
  }
  action.deny();
};
const addAeppConnection = (port) => {
  const connection = BrowserRuntimeConnection({
    connectionInfo: { id: port.sender.frameId },
    port,
  });
  sdk.addRpcClient(connection);
  sdk.shareWalletInfo(port.postMessage.bind(port));
  const shareWalletInfo = setInterval(() => sdk.shareWalletInfo(port.postMessage.bind(port)), 3000);
  port.onDisconnect.addListener(() => clearInterval(shareWalletInfo));
};

export async function init() {
  browser.runtime.onConnect.addListener(async (port) => {
    if (port.sender.id !== browser.runtime.id) return;

    switch (detectConnectionType(port)) {
      case CONNECTION_TYPES.POPUP: {
        const id = new URL(port.sender.url).searchParams.get('id');
        const { actions, props } = popups[id];

        port.onMessage.addListener((msg) => {
          if (msg.type === 'getProps') {
            port.postMessage({ uuid: msg.uuid, res: props });
            return;
          }
          actions[msg.type]();
        });

        port.onDisconnect.addListener(() => {
          delete popups[id];
        });
        break;
      }
      case CONNECTION_TYPES.OTHER: {
        if (!sdk) {
          if (!connectionsQueue) connectionsQueue = [];
          connectionsQueue.push(port);
          port.onDisconnect.addListener(() => {
            connectionsQueue = connectionsQueue.filter((p) => p !== port);
          });
          return;
        }

        addAeppConnection(port);
        break;
      }
      default:
        throw new Error('Unknown connection type');
    }
  });

  await store.dispatch('ensureRestored');
  // eslint-disable-next-line no-underscore-dangle
  await store._watcherVM.$watchUntilTruly(() => !isEmpty(store.getters.account));
  const { activeNetwork } = store.getters;

  sdk = await RpcWallet.compose({
    methods: {
      getApp(aeppUrl) {
        const hostPermissions = store.state.permissions[aeppUrl.hostname];
        if (!hostPermissions) store.commit('permissions/addHost', aeppUrl.hostname);
        return new App(aeppUrl);
      },
      async address(...args) {
        const { address } = store.getters.account;
        const app = args.pop();
        if (
          app instanceof App
          && !(await store.dispatch('permissions/requestAddressForHost', {
            host: app.host.hostname,
            address,
            connectionPopupCb: async () => showPopup(app.host.href, 'connectConfirm'),
          }))
        ) return Promise.reject(new Error('Rejected by user'));
        return address;
      },
      sign: (data) => Crypto.sign(data, store.getters.account.secretKey),
    },
  })({
    address: store.getters.account.address,
    nodes: [{ name: activeNetwork.name, instance: await Node({ url: activeNetwork.url }) }],
    compilerUrl: activeNetwork.compilerUrl,
    name: 'Superhero',
    onConnection: cbAccept,
    onDisconnect(_, client) {
      client.disconnect();
    },
    async onSubscription(aepp, { accept, deny }) {
      let activeAccount;
      try {
        activeAccount = await this.address(this.getApp(getAeppUrl(aepp)));
      } catch (e) {
        deny();
        return;
      }
      accept({
        accounts: {
          current: { [activeAccount]: {} },
          connected: {
            ...store.getters.accounts
              .reduce((p, { address }) => ({
                ...p, ...address !== activeAccount ? { [address]: {} } : {},
              }), {}),
          },
        },
      });
    },
    onSign: signCb.bind(null, 'sign'),
    onMessageSign: signCb.bind(null, 'messageSign'),
    onAskAccounts: cbAccept,
  });

  store.watch(
    (state, getters) => getters.activeNetwork,
    async (network, oldNetwork) => {
      if (isEqual(network, oldNetwork)) return;
      sdk.pool.delete(network.name);
      sdk.addNode(network.name, await Node({ url: network.url }), true);
    },
  );

  store.watch(
    ({ accounts: { activeIdx } }) => activeIdx,
    async (accountIdx) => sdk.selectAccount(store.getters.accounts[accountIdx].address),
  );

  store.watch(
    (state, getters) => getters.accounts.length,
    () => {
      sdk.accounts = store.getters.accounts
        .reduce((p, { address }) => ({ ...p, [address]: {} }), {});
    },
    { immediate: true },
  );

  connectionsQueue.forEach(addAeppConnection);
  connectionsQueue = [];
}

export function disconnect() {
  const { clients: aepps } = sdk.getClients();
  Array.from(aepps.values()).forEach((aepp) => {
    if (aepp.info.status !== 'DISCONNECTED') {
      aepp.sendMessage(
        { method: 'connection.close', params: { reason: 'bye' }, jsonrpc: '2.0' },
        true,
      );
    }
    aepp.connection.port.onDisconnect.dispatch();
    aepp.disconnect();
    browser.tabs.reload(aepp.connection.port.sender.tab.id);
    sdk.removeRpcClient(aepp.id);
  });
}
