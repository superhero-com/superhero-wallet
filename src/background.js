import { phishingCheckUrl, getPhishingUrls, setPhishingUrl } from './popup/utils/phishing-detect';
import { checkAeppConnected, initializeSDK, removeTxFromStorage, detectBrowser, parseFromStorage } from './popup/utils/helper';
import WalletContorller from './wallet-controller'
import Notification from './notifications';
import rpcWallet from './lib/rpcWallet'
import { 
    HDWALLET_METHODS,
    AEX2_METHODS
} from './popup/utils/constants'

global.browser = require('webextension-polyfill');


setInterval(() => {
    browser.windows.getAll({}).then((wins) => {
        if(wins.length == 0) {
            sessionStorage.removeItem("phishing_urls")
            browser.storage.local.remove('isLogged')
            browser.storage.local.remove('activeAccount')
        }
    });
},5000);

browser.browserAction.setBadgeText({ 'text': 'tip' });
browser.browserAction.setBadgeBackgroundColor({ color: "#FF004D"});

function getAccount() {
    return new Promise(resolve => {
        browser.storage.local.get('userAccount', data => {
            if (data.userAccount && data.userAccount.hasOwnProperty('publicKey')) {
                resolve({ keypair: {
                    publicKey: data.userAccount.publicKey,
                    secretKey: data.userAccount.secretKey
                }})
            }
        })
    });
}

const controller = new WalletContorller()

browser.runtime.onMessage.addListener( (msg, sender,sendResponse) => {
    switch(msg.method) {
        case 'phishingCheck':
            let data = {...msg, extUrl: browser.extension.getURL ('./') };
            phishingCheckUrl(msg.params.hostname)
            .then(res => {
                if(typeof res.result !== 'undefined' && res.result == 'blocked') {
                    let whitelist = getPhishingUrls().filter(url => url === msg.params.hostname);
                    if(whitelist.length) {
                        data.blocked = false;
                        return postPhishingData(data);
                    }
                    data.blocked = true;
                    return postPhishingData(data);
                }
                data.blocked = false;
                return postPhishingData(data);
            });
        break;
        case 'setPhishingUrl':
            let urls = getPhishingUrls();
            urls.push(msg.params.hostname);
            setPhishingUrl(urls);
        break;
    }

    return true
})

const checkPendingTx = () => {
    return new Promise((resolve,reject) => {
        browser.storage.local.get('pendingTransaction').then((tx) => {
            if(tx.hasOwnProperty("pendingTransaction")) {
                resolve(false)
            }else {
                resolve(false)
            }
        })
    })
}

const postPhishingData = (data) => {
    browser.tabs.query({active:true, currentWindow:true}).then((tabs) => { 
        const message = { method: 'phishingCheck', data };
        tabs.forEach(({ id }) => browser.tabs.sendMessage(id, message)) 
    });
}

const postToContent = (data, tabId) => {
    const message = { method: 'aeppMessage', data };
    browser.tabs.sendMessage(tabId, message)
}



/** 
 * AEX-2 RpcWallet Init
 */
rpcWallet.init(controller)

browser.runtime.onConnect.addListener( async ( port ) => {
    let extensionUrl = 'chrome-extension'
    if(detectBrowser() == 'Firefox') {
        extensionUrl = 'moz-extension'
    }

    const senderUrl = port.sender.url.split("?")
    const popupSender = Boolean((port.name == 'popup' && 
                                port.sender.id == browser.runtime.id && 
                                senderUrl[0] == `${extensionUrl}://${browser.runtime.id}/popup/popup.html` && 
                                detectBrowser() != 'Firefox') || 
                                (detectBrowser() == 'Firefox' && 
                                port.name == 'popup' && 
                                port.sender.id == browser.runtime.id ))
    
    if(!popupSender) {
        let check = rpcWallet.sdkReady(() => {
            rpcWallet.addConnection(port)
        })
        port.onDisconnect.addListener((p) => {
            clearInterval(check)
        })
    } else {
        port.onMessage.addListener(({ type, payload, uuid }, sender) => {
            if(HDWALLET_METHODS.includes(type)) {
                controller[type](payload).then((res) => {
                    port.postMessage({ uuid, res })
                })
            } else if(AEX2_METHODS.hasOwnProperty(type)) {
                rpcWallet[type](payload)
            }
        })  
    }
}) 


const notification = new Notification();


