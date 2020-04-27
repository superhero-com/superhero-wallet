import MemoryAccount from '@aeternity/aepp-sdk/es/account/memory';
import { RpcWallet } from '@aeternity/aepp-sdk/es/ae/wallet';
import BrowserRuntimeConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime';
import Node from '@aeternity/aepp-sdk/es/node';
import uuid from 'uuid';
import { isEmpty } from 'lodash-es';
import {
  parseFromStorage,
  extractHostName,
  getAeppAccountPermission,
  getActiveNetwork,
  stringifyForStorage,
  addTipAmount,
  getTippedAmount,
  resetTippedAmount,
  getContractCallInfo,
  getAddressByNameEntry,
} from '../popup/utils/helper';
import {
  DEFAULT_NETWORK,
  AEX2_METHODS,
  NO_POPUP_AEPPS,
  BLACKLIST_AEPPS,
  MAX_AMOUNT_WITHOUT_CONFIRM,
} from '../popup/utils/constants';
import { mockLogin } from '../popup/utils';
import { getState } from '../store/plugins/persistState';

global.browser = require('webextension-polyfill');

const rpcWallet = {
  async init(walletController, popups) {
    this.popups = popups;
    await this.initNodes();
    this.initFields();
    this.controller = walletController;
    if (process.env.RUNNING_IN_TESTS) await mockLogin();
    const { account } = await getState();
    if (!isEmpty(account)) {
      this.controller.generateWallet({ seed: stringifyForStorage(account.privateKey) });
      const {
        current: { network },
      } = await getState();
      this[AEX2_METHODS.INIT_RPC_WALLET]({ address: account.publicKey, network });
    }
  },
  async initSubaccounts() {
    const { subaccounts } = await getState();
    this.subaccounts = subaccounts;
    return Promise.resolve(true);
  },
  initSdk() {
    this.recreateWallet();
  },
  initFields() {
    this.sdk = null;
    this.initNetwork();
    this.activeAccount = null;
    this.subaccounts = null;
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
    const nodes = await getActiveNetwork();
    this.nodes = nodes.all;
    return Promise.resolve(true);
  },
  async createWallet() {
    this.accountKeyPairs = await Promise.all(
      this.subaccounts.map(async (a, index) =>
        parseFromStorage(await this.controller.getKeypair({ activeAccount: index, account: a })),
      ),
    );

    this.accounts = this.accountKeyPairs.map(a =>
      MemoryAccount({
        keypair: a,
      }),
    );
    const context = this;
    try {
      const node = await Node({ url: this.internalUrl, internalUrl: this.internalUrl });
      this.sdk = await RpcWallet({
        nodes: [{ name: this.network, instance: node }],
        compilerUrl: this.compiler,
        name: 'SuperHero',
        accounts: this.accounts,
        async onConnection(aepp, action) {
          context.shouldOpenPopup(aepp, action, () => {
            context.checkAeppPermissions(aepp, action, 'connection');
          });
        },
        onDisconnect(msg, client) {
          client.disconnect();
        },
        async onSubscription(aepp, action) {
          context.shouldOpenPopup(aepp, action, () => {
            context.checkAeppPermissions(aepp, action, 'subscription');
          });
        },
        async onSign(aepp, action) {
          context.shouldOpenPopup(aepp, action, () => {
            context.checkAeppPermissions(aepp, action, 'sign', () => {
              setTimeout(() => {
                context.showPopup({ aepp, action, type: 'sign' });
              }, 2000);
            });
          });
        },
        async onMessageSign(aepp, action) {
          context.shouldOpenPopup(aepp, action, () => {
            context.checkAeppPermissions(aepp, action, 'messageSign', () => {
              context.showPopup({ aepp, action, type: 'messageSign' });
            });
          });
        },
        onAskAccounts(aepp, action) {
          context.shouldOpenPopup(aepp, action, () => {
            context.checkAeppPermissions(aepp, action, 'accounts', () => {
              setTimeout(() => {
                context.showPopup({ aepp, action, type: 'askAccounts' });
              }, 2000);
            });
          });
        },
      });

      if (!this.activeAccount) {
        this.sdk.selectAccount(this.accountKeyPairs[0].publicKey);
        this.activeAccount = this.accountKeyPairs[0].publicKey;
      }
      this.tipContractAddress = this.tipContractAddress.includes('.chain')
        ? getAddressByNameEntry(
            await this.sdk.api.getNameEntryByName(this.tipContractAddress),
            'contract_pubkey',
          )
        : this.tipContractAddress;
      this.connectionsQueue.forEach(c => this.addConnection(c));
    } catch (e) {
      this.sdk = null;
    }
    return this.sdk;
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
  async shouldOpenPopup(aepp, action, cb) {
    const { isTip, amount } = getContractCallInfo(action.params.tx, this.tipContractAddress);
    const origin = this.getAeppOrigin(aepp);
    if (BLACKLIST_AEPPS.includes(origin)) {
      // deny action if in blacklist
      action.deny();
    } else if (NO_POPUP_AEPPS.includes(origin)) {
      if (isTip) {
        const tippedAmount = await getTippedAmount();
        if (tippedAmount >= MAX_AMOUNT_WITHOUT_CONFIRM) {
          cb();
          resetTippedAmount();
        } else {
          action.accept();
          await addTipAmount(amount);
        }
      } else {
        action.accept();
      }
    } else {
      // open popup
      cb();
    }
  },
  sdkReady() {
    return this.sdk;
  },
  addConnectionToQueue(port) {
    this.connectionsQueue.push(port);
  },
  removeConnectionFromQueue(port) {
    this.connectionsQueue = this.connectionsQueue.filter(p => p.uuid !== port.uuid);
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
        const a = caller === 'connection' ? action : {};
        await this.showPopup({ action: a, aepp, type: 'connectConfirm' });
        if (typeof cb !== 'undefined') {
          cb();
        }
      } catch (e) {
        console.error(`checkAeppPermissions: ${e}`);
      }
    } else if (typeof cb === 'undefined') {
      action.accept();
    } else {
      cb();
    }
  },

  async showPopup({ action, aepp, type = 'connectConfirm' }) {
    const id = uuid();
    const popupUrl = `${browser.runtime.getURL('./popup/popup.html')}?id=${id}&type=${type}`;
    const popupWindow = await browser.windows.create({
      url: popupUrl,
      type: 'popup',
      height: 600,
      width: 375,
    });
    if (!popupWindow) return action.deny();

    return new Promise((resolve, reject) => {
      try {
        this.popups.addPopup(id, this.controller);
        this.popups.addActions(id, { ...action, resolve, reject });
        const {
          connection: {
            port: {
              sender: { url },
            },
          },
          info: { icons, name },
        } = aepp;
        const { protocol } = new URL(url);
        this.popups.setAeppInfo(id, {
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

  async addConnection(port) {
    try {
      const connection = await BrowserRuntimeConnection({
        connectionInfo: { id: port.sender.frameId },
        port,
      });
      this.sdk.addRpcClient(connection);
      this.sdk.shareWalletInfo(port.postMessage.bind(port));
    } catch (e) {
      console.warn(e);
    }
    setTimeout(() => this.sdk.shareWalletInfo(port.postMessage.bind(port)), 3000);
    this.removeConnectionFromQueue(port);
  },
  getClientsByCond(condition) {
    const clients = Array.from(this.sdk.getClients().clients.values()).filter(condition);
    return clients;
  },
  getAccessForAddress(address) {
    const clients = this.getClientsByCond(client => client.isConnected());
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
        await this.controller.getKeypair({ activeAccount: payload.idx, account }),
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
    this.initNodes();
    this.initNetwork(network);
    const node = await Node({ url: this.internalUrl, internalUrl: this.internalUrl });
    if (this.sdk) {
      try {
        await this.sdk.addNode(network, node, true);
      } catch (e) {
        console.error(`addNewNetwork: ${e}`);
      }
      this.sdk.selectNode(network);
    }
  },
  async [AEX2_METHODS.LOGOUT]() {
    this.controller.lockWallet();
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
      await this.initSubaccounts();
      this.initSdk();
    }
  },
  async recreateWallet() {
    await this.createWallet();
  },
};

export default rpcWallet;
