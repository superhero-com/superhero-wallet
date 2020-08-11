import MemoryAccount from '@aeternity/aepp-sdk/es/account/memory';
import { RpcWallet } from '@aeternity/aepp-sdk/es/ae/wallet';
import Node from '@aeternity/aepp-sdk/es/node';
import BrowserRuntimeConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime';
import { isEmpty } from 'lodash-es';
import uuid from 'uuid';
import {
  AEX2_METHODS,
  DEFAULT_NETWORK,
  MAX_AMOUNT_WITHOUT_CONFIRM,
  NO_POPUP_AEPPS,
} from '../popup/utils/constants';
import {
  addTipAmount,
  extractHostName,
  getAllNetworks,
  getAddressByNameEntry,
  getAeppAccountPermission,
  getContractCallInfo,
  getTippedAmount,
  parseFromStorage,
  resetTippedAmount,
  stringifyForStorage,
} from '../popup/utils/helper';
import { getState } from '../store/plugins/persistState';
import popups from './popup-connection';
import walletController from '../wallet-controller';

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
      this[AEX2_METHODS.INIT_RPC_WALLET]({ address: account.publicKey, network });
    }
  },
  initFields() {
    this.sdk = null;
    this.initNetwork();
    this.activeAccount = null;
    this.accounts = [];
    this.accountKeyPairs = [];
    this.connectionsQueue = [];
  },
  initNetwork(network = DEFAULT_NETWORK) {
    this.network = network;
    this.compiler = this.nodes[network].compilerUrl;
    this.internalUrl = this.nodes[network].internalUrl;
    this.tipContractAddress = this.nodes[network].tipContract;
  },
  async initNodes() {
    this.nodes = await getAllNetworks();
  },
  async initSdk() {
    const context = this;
    try {
      const node = await Node({ url: this.internalUrl, internalUrl: this.internalUrl });
      this.sdk = await RpcWallet({
        nodes: [{ name: this.network, instance: node }],
        compilerUrl: this.compiler,
        name: 'Superhero',
        async onConnection(aepp, action) {
          const open = await context.shouldOpenPopup(aepp, action);
          if (open) context.checkAeppPermissions(aepp, action, 'connection');
        },
        onDisconnect(msg, client) {
          client.disconnect();
        },
        async onSubscription(aepp, action) {
          const open = await context.shouldOpenPopup(aepp, action);
          if (open) context.checkAeppPermissions(aepp, action, 'subscription');
        },
        async onSign(aepp, action) {
          const open = await context.shouldOpenPopup(aepp, action);
          if (open) {
            context.checkAeppPermissions(aepp, action, 'sign', () =>
              setTimeout(() => context.showPopup({ aepp, action, type: 'sign' }), 2000),
            );
          }
        },
        async onMessageSign(aepp, action) {
          const open = await context.shouldOpenPopup(aepp, action);
          if (open) {
            context.checkAeppPermissions(aepp, action, 'messageSign', () =>
              context.showPopup({ aepp, action, type: 'messageSign' }),
            );
          }
        },
        async onAskAccounts(aepp, action) {
          const open = await context.shouldOpenPopup(aepp, action);
          if (open) {
            context.checkAeppPermissions(aepp, action, 'accounts', () =>
              setTimeout(() => context.showPopup({ aepp, action, type: 'askAccounts' }), 2000),
            );
          }
        },
      });

      this.tipContractAddress = this.tipContractAddress.includes('.chain')
        ? getAddressByNameEntry(
            await this.sdk.api.getNameEntryByName(this.tipContractAddress).catch(() => false),
            'contract_pubkey',
          )
        : this.tipContractAddress;
      this.connectionsQueue.forEach(c => this.addConnection(c));
      this.connectionsQueue = [];
    } catch (e) {
      this.sdk = null;
    }
  },
  getAeppOrigin(aepp) {
    const {
      connection: {
        port: {
          sender: { url },
        },
      },
    } = aepp;
    return extractHostName(url);
  },
  async shouldOpenPopup(aepp, action) {
    const { isTip, amount } = getContractCallInfo(action.params.tx, this.tipContractAddress);
    const origin = this.getAeppOrigin(aepp);
    if (NO_POPUP_AEPPS.includes(origin)) {
      if (isTip) {
        const tippedAmount = await getTippedAmount();
        if (tippedAmount >= MAX_AMOUNT_WITHOUT_CONFIRM) {
          resetTippedAmount();
          return true;
        }
        action.accept();
        await addTipAmount(amount);
      } else {
        action.accept();
      }
    } else {
      return true;
    }
    return false;
  },
  async checkAeppPermissions(aepp, action, caller, cb) {
    const {
      connection: {
        port: {
          sender: { url },
        },
      },
    } = aepp;
    const isConnected = await getAeppAccountPermission(extractHostName(url), this.activeAccount);
    if (!isConnected) {
      try {
        await this.showPopup({
          action: caller === 'connection' ? action : {},
          aepp,
          type: 'connectConfirm',
        });
        if (cb) cb();
      } catch (e) {
        console.error(`checkAeppPermissions: ${e}`);
      }
    } else if (!cb) {
      action.accept();
    } else {
      cb();
    }
  },

  async showPopup({ action, aepp, type = 'connectConfirm' }) {
    const id = uuid();
    const {
      connection: {
        port: {
          sender: { url },
        },
      },
      info: { icons, name },
    } = aepp;
    const tabs = await browser.tabs.query({ active: true });
    tabs.forEach(({ url: tabURL, id: tabId }) => {
      const tabUrl = new URL(tabURL);
      if (
        tabUrl.searchParams.get('type') === 'connectConfirm' &&
        decodeURIComponent(tabUrl.searchParams.get('url')) === url
      ) {
        browser.tabs.remove(tabId);
      }
    });
    const extUrl = browser.runtime.getURL('./popup/popup.html');
    const popupUrl = `${extUrl}?id=${id}&type=${type}&url=${encodeURIComponent(url)}`;
    const popupWindow = await browser.windows.create({
      url: popupUrl,
      type: 'popup',
      height: 600,
      width: 375,
    });
    if (!popupWindow) return action.deny();

    return new Promise((resolve, reject) => {
      try {
        popups.addPopup(id);
        popups.addActions(id, { ...action, resolve, reject });
        const { protocol } = new URL(url);
        popups.setAeppInfo(id, {
          type,
          action: { params: action.params, method: action.method },
          url,
          icons,
          name,
          protocol,
          host: extractHostName(url),
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
        this.connectionsQueue = this.connectionsQueue.filter(p => p !== port);
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
  getAccessForAddress(address) {
    const clients = Array.from(this.sdk.getClients().clients.values()).filter(client =>
      client.isConnected(),
    );
    clients.forEach(async client => {
      const {
        connection: {
          port: {
            sender: { url },
          },
        },
      } = client;
      const isConnected = await getAeppAccountPermission(extractHostName(url), address);
      if (!isConnected) {
        const accept = await this.showPopup({ action: {}, aepp: client, type: 'connectConfirm' });
        if (accept) {
          this.sdk.selectAccount(address);
        }
      } else {
        this.sdk.selectAccount(address);
      }
    });
  },
  [AEX2_METHODS.CHANGE_ACCOUNT](payload) {
    this.activeAccount = payload;
    this.getAccessForAddress(payload);
  },
  async [AEX2_METHODS.ADD_ACCOUNT](payload) {
    const account = {
      publicKey: payload.address,
    };
    const newAccount = MemoryAccount({
      keypair: parseFromStorage(
        await walletController.getKeypair({ activeAccount: payload.idx, account }),
      ),
    });
    this.sdk.addAccount(newAccount);
    this.activeAccount = payload.address;
    this.getAccessForAddress(payload.address);
  },
  async [AEX2_METHODS.SWITCH_NETWORK](payload) {
    this.addNewNetwork(payload);
  },
  async addNewNetwork(network) {
    await this.initNodes();
    this.initNetwork(network);
    const node = await Node({ url: this.internalUrl, internalUrl: this.internalUrl });
    if (this.sdk) {
      try {
        await this.sdk.addNode(network, node, true);
      } catch (e) {
        console.warn(`addNewNetwork: ${e}`);
      }
      this.sdk.selectNode(network);
    }
  },
  async [AEX2_METHODS.LOGOUT]() {
    const { clients: aepps } = this.sdk.getClients();
    Array.from(aepps.values()).forEach(aepp => {
      aepp.sendMessage(
        { method: 'connection.close', params: { reason: 'bye' }, jsonrpc: '2.0' },
        true,
      );
      aepp.connection.port.onDisconnect.dispatch();
      aepp.disconnect();
      browser.tabs.reload(aepp.connection.port.sender.tab.id);
      this.sdk.removeRpcClient(aepp.id);
    });
    walletController.lockWallet();
    this.initFields();
  },
  async [AEX2_METHODS.INIT_RPC_WALLET]({ address, network }) {
    this.activeAccount = address;
    if (!this.nodes[network]) {
      await this.initNodes();
    }
    if (this.sdk) {
      try {
        this.sdk.selectAccount(this.activeAccount);
      } catch (e) {
        this[AEX2_METHODS.ADD_ACCOUNT]({ address, idx: 0 });
      }

      if (this.network !== network) {
        this.addNewNetwork(network);
      }
    } else {
      this.initNetwork(network);
      this.initSdk();
    }
  },
};
