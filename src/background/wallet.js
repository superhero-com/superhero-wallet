import { RpcWallet } from '@aeternity/aepp-sdk/es/ae/wallet';
import { Crypto } from '@aeternity/aepp-sdk/es';
import Node from '@aeternity/aepp-sdk/es/node';
import BrowserRuntimeConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime';
import { isEmpty } from 'lodash-es';
import uuid from 'uuid';
import { AEX2_METHODS, defaultNetwork } from '../popup/utils/constants';
import { getAllNetworks, stringifyForStorage } from '../popup/utils/helper';
import { getState } from '../store/plugins/persistState';
import popups from './popup-connection';
import walletController from './wallet-controller';
import store from './store';
import { App } from '../store/modules/permissions';

global.browser = require('webextension-polyfill');

export default {
  async init() {
    await this.initNodes();
    this.initFields();
    const { account } = await getState();
    if (!isEmpty(account)) {
      walletController.generateWallet({ seed: stringifyForStorage(account.privateKey) });
      const {
        current: { network },
      } = await getState();
      this[AEX2_METHODS.INIT_RPC_WALLET](network);
    }
  },
  initFields() {
    this.sdk = null;
    this.initNetwork();
    this.connectionsQueue = [];
  },
  initNetwork(network = defaultNetwork.name) {
    this.network = network;
    this.compiler = this.nodes[network].compilerUrl;
    this.url = this.nodes[network].url;
  },
  async initNodes() {
    this.nodes = await getAllNetworks();
  },
  getAeppUrl: (v) => new URL(v.connection.port.sender.url),
  async initSdk() {
    const context = this;
    try {
      const node = await Node({ url: this.url });
      const cbAccept = (_, { accept }) => accept();
      const signCb = async (type, aepp, action) => {
        const { method, params } = action;
        if (
          (await store.dispatch('permissions/checkPermissions', {
            host: context.getAeppUrl(aepp).hostname,
            method,
            params: params?.txObject?.params,
          })) ||
          (await context.showPopup(aepp, type, method, params))
        ) {
          action.accept.apply(null, [
            ...(method === 'message.sign' ? [] : [null]),
            { onAccount: { sign: () => {}, address: () => {} } },
          ]);
          return;
        }
        action.deny();
      };

      this.sdk = await RpcWallet.compose({
        methods: {
          getApp(aeppUrl) {
            const hostPermissions = store.state.permissions[aeppUrl.hostname];
            if (!hostPermissions) store.commit('permissions/addHost', aeppUrl.hostname);
            return new App(aeppUrl);
          },
          async address(...args) {
            const address = store.state.account.publicKey;
            const app = args.pop();
            if (
              app instanceof App &&
              !(await store.dispatch('permissions/requestAddressForHost', {
                host: app.host.hostname,
                address,
                connectionPopupCb: async () => context.showPopup(app.host.href),
              }))
            )
              return Promise.reject(new Error('Rejected by user'));
            return address;
          },
          sign: (data) => {
            const { secretKey } = JSON.parse(
              walletController.getKeypair({
                activeAccount: store.state.activeAccount,
                account: store.state.account,
              }),
            );
            return Crypto.sign(data, Buffer.from(new Uint8Array(secretKey.data), 'hex'));
          },
        },
      })({
        nodes: [{ name: this.network, instance: node }],
        compilerUrl: this.compiler,
        name: 'Superhero',
        onConnection: cbAccept,
        onDisconnect(_, client) {
          client.disconnect();
        },
        async onSubscription(aepp, { accept, deny }) {
          const address = await this.address(this.getApp(context.getAeppUrl(aepp)));
          if (!address) {
            deny();
            return;
          }
          accept({
            accounts: {
              current: { [address]: {} },
              connected: {},
            },
          });
        },
        onSign: signCb.bind(null, 'sign'),
        onMessageSign: signCb.bind(null, 'messageSign'),
        onAskAccounts: cbAccept,
      });

      this.connectionsQueue.forEach((c) => this.addConnection(c));
      this.connectionsQueue = [];
    } catch (e) {
      this.sdk = null;
    }
  },

  async showPopup(aepp, type = 'connectConfirm', method = '', params = {}) {
    const id = uuid();
    const { href, protocol, host } =
      typeof aepp === 'object' ? this.getAeppUrl(aepp) : new URL(aepp);
    const tabs = await browser.tabs.query({ active: true });
    tabs.forEach(({ url: tabURL, id: tabId }) => {
      const tabUrl = new URL(tabURL);
      if (
        tabUrl.searchParams.get('type') === 'connectConfirm' &&
        decodeURIComponent(tabUrl.searchParams.get('url')) === href
      ) {
        browser.tabs.remove(tabId);
      }
    });

    const extUrl = browser.runtime.getURL('./popup/popup.html');
    const popupUrl = `${extUrl}?id=${id}&type=${type}&url=${encodeURIComponent(href)}`;
    const popupWindow = await browser.windows.create({
      url: popupUrl,
      type: 'popup',
      height: 600,
      width: 375,
    });

    return new Promise((resolve, reject) => {
      try {
        if (!popupWindow) reject();
        popups.addPopup(id);
        popups.addActions(id, { resolve, reject });
        popups.setAeppInfo(id, {
          type,
          action: { params, method },
          url: href,
          icons: aepp?.icons || [],
          name: aepp?.name || host,
          protocol,
          host,
        });
      } catch (e) {
        console.error(`showPopup: ${e}`);
      }
    });
  },

  addConnection(port) {
    if (!this.sdk) {
      if (!this.connectionsQueue) this.connectionsQueue = [];
      this.connectionsQueue.push(port);
      port.onDisconnect.addListener(() => {
        this.connectionsQueue = this.connectionsQueue.filter((p) => p !== port);
      });
      return;
    }

    try {
      const connection = BrowserRuntimeConnection({
        connectionInfo: { id: port.sender.frameId },
        port,
      });
      this.sdk.addRpcClient(connection);
      this.sdk.shareWalletInfo(port.postMessage.bind(port));
    } catch (e) {
      console.warn(e);
    }
    const shareWalletInfo = setInterval(
      () => this.sdk.shareWalletInfo(port.postMessage.bind(port)),
      3000,
    );
    port.onDisconnect.addListener(() => clearInterval(shareWalletInfo));
  },
  async [AEX2_METHODS.SWITCH_NETWORK](payload) {
    this.addNewNetwork(payload);
  },
  async addNewNetwork(network) {
    await this.initNodes();
    this.initNetwork(network);
    const node = await Node({ url: this.url });
    if (this.sdk) {
      try {
        await this.sdk.addNode(network, node, true);
      } catch (e) {
        console.warn(`addNewNetwork: ${e}`);
      }
      this.sdk.selectNode(network);
    }
  },
  async disconnect() {
    const { clients: aepps } = this.sdk.getClients();
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
      this.sdk.removeRpcClient(aepp.id);
    });
  },
  async [AEX2_METHODS.INIT_RPC_WALLET](network) {
    if (!this.nodes[network]) {
      await this.initNodes();
    }
    if (!this.sdk) {
      this.initNetwork(network);
      await this.initSdk();
    }

    if (this.network !== network) {
      await this.addNewNetwork(network);
    }
  },
};
