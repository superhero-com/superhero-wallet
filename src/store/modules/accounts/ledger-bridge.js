export default class LedgerBridge {
  constructor(url) {
    this.bridgeUrl = url;
    this.iframe = document.createElement('iframe');
    this.iframe.src = this.bridgeUrl;
    document.head.appendChild(this.iframe);
  }

  getAddress(idx, askForApproval) {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          action: 'getAddress',
          params: [idx, askForApproval],
        },
        ({ success, payload }) => {
          if (success) {
            resolve(payload);
          } else {
            reject(new Error(payload));
          }
        },
      );
    });
  }

  signTransaction(idx, tx, networkId) {
    return new Promise((resolve, reject) => {
      this.sendMessage(
        {
          action: 'signTransaction',
          params: [idx, tx, networkId],
        },
        ({ success, payload }) => {
          if (success) {
            resolve(payload);
          } else {
            reject(new Error(payload));
          }
        },
      );
    });
  }

  sendMessage(msg, cb) {
    // eslint-disable-next-line no-param-reassign
    msg.target = 'LEDGER-IFRAME';
    this.iframe.contentWindow.postMessage(msg, '*');
    window.addEventListener('message', ({ origin, data }) => {
      if (origin !== this.bridgeUrl.split('/').slice(0, -1).join('/')) return false;
      if (data && data.action && data.action === `${msg.action}-reply`) {
        cb(data);
      }
      return true;
    });
  }
}
