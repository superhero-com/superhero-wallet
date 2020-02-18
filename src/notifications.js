import Node from '@aeternity/aepp-sdk/es/node';
import { Universal as Ae } from '@aeternity/aepp-sdk/es';
import { setInterval } from 'timers';
import { networks, DEFAULT_NETWORK, NOTIFICATION_METHODS } from './popup/utils/constants';
import { detectBrowser, getUserNetworks } from './popup/utils/helper';

global.browser = require('webextension-polyfill');

export default class Notification {
  constructor() {
    this.init();
  }

  async init() {
    let { activeNetwork } = await browser.storage.local.get('activeNetwork');
    await this.getNodes();
    this.network = this.nodes[DEFAULT_NETWORK];
    if (typeof activeNetwork !== 'undefined') {
      this.network = this.nodes[activeNetwork];
    } else {
      activeNetwork = DEFAULT_NETWORK;
    }
    const node = await Node({ url: this.network.internalUrl, internalUrl: this.network.internalUrl });
    this.client = await Ae({
      nodes: [{ name: activeNetwork, instance: node }],
      networkId: this.network.networkId,
      compilerUrl: this.network.compilerUrl,
    });

    setInterval(() => {
      this.checkTxReady();
    }, 2000);
    browser.notifications.onButtonClicked.addListener(id => {
      browser.tabs.create({ url: id.split('?')[1], active: true });
    });
  }

  async getNodes() {
    const userNetworks = await getUserNetworks();
    const nodes = { ...networks, ...userNetworks };
    this.nodes = nodes;
    return Promise.resolve(this.nodes);
  }

  async [NOTIFICATION_METHODS.SWITCH_NETWORK](network) {
    await this.getNodes();
    this.network = this.nodes[network];

    const node = await Node({ url: this.network.internalUrl, internalUrl: this.network.internalUrl });
    if (this.client) {
      try {
        await this.client.addNode(network, node, true);
      } catch (e) {
        console.log(e);
      }
      this.client.selectNode(network);
    }
  }

  async getAllNotifications() {
    const { processingTx } = await browser.storage.local.get('processingTx');
    return processingTx;
  }

  async deleteNotification(tx) {
    const { processingTx } = await browser.storage.local.get('processingTx');
    let list = [...processingTx];
    list = list.filter(t => t != tx);
    await browser.storage.local.set({ processingTx: list });
  }

  async checkTxReady() {
    const noties = await this.getAllNotifications();
    if (noties) {
      noties.forEach(async (tx, index) => {
        if (tx !== 'error' && tx) {
          const res = await this.client.poll(tx);
          const url = `${this.network.explorerUrl}/transactions/${tx}`;
          await this.sendNoti({ title: 'Transaction ready', message: `You can expore your transaction by clicking button below`, contextMessage: url, error: false });
        } else {
          await this.sendNoti({ title: 'Transaction error', message: 'Transaction cannot be processed ', error: true });
        }

        await this.deleteNotification(tx);
      });
    }
  }

  async sendNoti({ title, message, contextMessage, error }) {
    let params = {
      type: 'basic',
      title,
      iconUrl: browser.runtime.getURL('../../../icons/icon_48.png'),
      message,
      priority: 2,
    };
    if (detectBrowser() != 'Firefox') {
      if (!error) {
        params = {
          ...params,
          buttons: [{ title: 'See transaction details' }],
        };
      }
    }

    const noti = await browser.notifications.create(`popup.html?${contextMessage}`, params);

    return Promise.resolve(true);
  }
}
