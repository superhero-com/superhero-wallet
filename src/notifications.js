import iconUrl from './icons/icon_48.png';
import { getSDK, getNodes } from './lib/background-utils';
import { NOTIFICATION_METHODS } from './popup/utils/constants';
import { detectBrowser } from './popup/utils/helper';
import { getState } from './store/plugins/persistState';

global.browser = require('webextension-polyfill');

async function deleteNotification(tx) {
  const { processingTx } = await browser.storage.local.get('processingTx');
  let list = [...processingTx];
  list = list.filter(t => t !== tx);
  await browser.storage.local.set({ processingTx: list });
}

async function sendNoti({ title, message, contextMessage, error }) {
  let params = {
    type: 'basic',
    title,
    iconUrl,
    message,
    priority: 2,
  };
  if (detectBrowser() !== 'Firefox') {
    if (!error) {
      params = {
        ...params,
        buttons: [{ title: 'See transaction details' }],
      };
    }
  }

  await browser.notifications.create(`popup.html?${contextMessage}`, params);
}

export default class Notification {
  constructor() {
    this.init();
  }

  async init() {
    this.client = await getSDK();
    this.network = (await getNodes()).network;
    browser.notifications.onButtonClicked.addListener(id => {
      browser.tabs.create({ url: id.split('?')[1], active: true });
    });
  }

  async [NOTIFICATION_METHODS.SWITCH_NETWORK]() {
    this.client = await getSDK();
    this.network = (await getNodes()).network;
  }

  async checkTxReady() {
    const { txQueue } = await getState();
    if (txQueue) {
      txQueue.forEach(async tx => {
        if (tx !== 'error' && tx) {
          await this.client.poll(tx);
          const url = `${this.network.explorerUrl}/transactions/${tx}`;
          await sendNoti({
            title: 'Transaction ready',
            message: `You can explore your transaction by clicking button below`,
            contextMessage: url,
            error: false,
          });
        } else {
          await sendNoti({
            title: 'Transaction error',
            message: 'Transaction cannot be processed ',
            error: true,
          });
        }

        await deleteNotification(tx);
      });
    }
  }
}
