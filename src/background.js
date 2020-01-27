import { phishingCheckUrl, getPhishingUrls, setPhishingUrl } from './popup/utils/phishing-detect';
import { checkAeppConnected, initializeSDK, removeTxFromStorage, detectBrowser, parseFromStorage } from './popup/utils/helper';
import WalletContorller from './wallet-controller'
import Notification from './notifications';
import { setController, contractCallStatic } from './popup/utils/aepp-utils'

global.browser = require('webextension-polyfill');

// listen for our browerAction to be clicked
browser.browserAction.onClicked.addListener(function (tab) {
    // for the current tab, inject the "inject.js" file & execute it
	browser.tabs.executeScript(tab.id, {
        file: 'inject.js'
	}); 
});

setInterval(() => {
    browser.windows.getAll({}).then((wins) => {
        if(wins.length == 0) {
            sessionStorage.removeItem("phishing_urls");
            browser.storage.local.remove('isLogged')
            browser.storage.local.remove('activeAccount')
        }
    });
},5000);

function getAccount() {
    return new Promise(resolve => {
        browser.storage.sync.get('userAccount', data => {
            if (data.userAccount && data.userAccount.hasOwnProperty('publicKey')) {
                resolve({ keypair: {
                    publicKey: data.userAccount.publicKey,
                    secretKey: data.userAccount.secretKey
                }})
            }
        })
    });
}

const error = {
    "error": {
        "code": 1,
        "data": {
            "request": {}
        },
        "message": "Transaction verification failed"
    },
    "id": null,
    "jsonrpc": "2.0"
}

const controller = new WalletContorller()
setController(controller)
browser.runtime.onMessage.addListener( (msg, sender,sendResponse) => {
    // setController(controller)
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
        case 'aeppMessage':
            switch(msg.params.type) {
                case "txSign":
                    checkAeppConnected(msg.params.hostname).then((check) => {
                        if(check) {
                            openAeppPopup(msg,'txSign')
                            .then(res => {
                                sendResponse(res)
                            })
                        }else {
                            error.error.message = "Account not connected. Establish connection first"
                            error.id = msg.id
                            sendResponse(error)
                        }
                    });
                break;

                case 'connectConfirm':
                    checkAeppConnected(msg.params.params.hostname).then((check) => {
                        if(!check) {
                            openAeppPopup(msg,'connectConfirm')
                            .then(res => {
                                sendResponse(res)
                            })
                        } else {
                            error.error.message = "Connection already established"
                            error.id = msg.id
                            sendResponse(error)
                        }
                    })
                break;

                case 'getAddress':
                    browser.storage.local.get('userAccount').then((user)=> {
                        browser.storage.local.get('isLogged').then((data) => {
                            if (data.isLogged && data.hasOwnProperty('isLogged')) {
                                browser.storage.local.get('subaccounts').then((subaccounts) => {
                                    browser.storage.local.get('activeAccount').then((active) => {
                                        let activeIdx = 0
                                        if(active.hasOwnProperty("activeAccount")) {
                                            activeIdx = active.activeAccount
                                        }
                                        let address = subaccounts.subaccounts[activeIdx].publicKey
                                        sendResponse({id:null, jsonrpc:"2.0",address})
                                    })
                                })
                            }else {
                                sendResponse({id:null, jsonrpc:"2.0",address:""})
                            }
                        })
                    })
                break;
                
                case 'contractCall':
                    checkAeppConnected(msg.params.hostname).then((check) => {
                        if(check) {
                            if(typeof msg.params.callType != "undefined" && msg.params.callType == 'static') {
                                if(msg.params.hasOwnProperty("tx") && msg.params.tx.hasOwnProperty("params")) {
                                    msg.params.tx.params = parseFromStorage(msg.params.tx.params)
                                }
                                contractCallStatic(msg.params).then(res => {
                                    res.id = msg.id
                                    sendResponse(res)
                                }).catch(err => {
                                    error.error.message = err
                                    error.id = msg.id
                                    sendResponse(error)
                                });
                            } else {
                                openAeppPopup(msg,'contractCall')
                                .then(res => {
                                    sendResponse(res)
                                })
                            }
                        }else {
                            error.error.message = "Account not connected. Establish connection first"
                            error.id = msg.id
                            sendResponse(error)
                        }
                    })
                    
                break;
                
                case 'signMessage':
                    checkAeppConnected(msg.params.hostname).then((check) => {
                        if(check) {
                            openAeppPopup(msg,'signMessage')
                            .then(res => {
                                sendResponse(res)
                            })
                        }else {
                            error.error.message = "Account not connected. Establish connection first"
                            error.id = msg.id
                            sendResponse(error)
                        }
                    })
                break;

                case 'verifyMessage':
                    checkAeppConnected(msg.params.hostname).then((check) => {
                        if(check) {
                            openAeppPopup(msg,'verifyMessage')
                            .then(res => {
                                sendResponse(res)
                            })
                        }else {
                            error.error.message = "Account not connected. Establish connection first"
                            error.id = msg.id
                            sendResponse(error)
                        }
                    })
                break;
            }
        break
    }

    return true
})


const connectToPopup = (cb,type, id) => {
    browser.runtime.onConnect.addListener((port) => {
        port.onMessage.addListener((msg,sender) => {
            msg.id = sender.name
            if(id == sender.name) cb(msg)
        });
        port.onDisconnect.addListener(async (event) => {
            let list = await removeTxFromStorage(event.name)
            browser.storage.local.set({pendingTransaction: { list } }).then(() => {})
            browser.storage.local.remove('showAeppPopup').then(() => {}); 
            error.id = event.name
            if(event.name == id) {
                if(type == 'txSign') {
                    error.error.message = "Transaction rejected by user"
                    cb(error)
                }else if(type == 'connectConfirm') {
                    error.error.message = "Connection canceled"
                    cb(error)
                }else if(type == 'contractCall') {
                    error.error.message = "Transaction rejected by user"
                    cb(error)
                }else {
                    cb()
                }
            }
        });
   })
}

const openAeppPopup = (msg,type) => {
    return new Promise((resolve,reject) => {
        browser.storage.local.set({showAeppPopup:{ data: msg.params, type } } ).then( () => {
            browser.windows.create({
                url: browser.runtime.getURL('./popup/popup.html'),
                type: "popup",
                height: 680,
                width:420
            }).then((window) => {
                connectToPopup((res) => {
                    resolve(res)
                }, type, msg.params.id)
            })
        })
    })
}

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



browser.runtime.onConnect.addListener( ( port ) => {
    let extensionUrl = 'chrome-extension'
    if(detectBrowser() == 'Firefox') {
        extensionUrl = 'moz-extension'
    }
    if((port.name == 'popup' && port.sender.id == browser.runtime.id && port.sender.url == `${extensionUrl}://${browser.runtime.id}/popup/popup.html` && detectBrowser() != 'Firefox') || ( detectBrowser() == 'Firefox' && port.name == 'popup' && port.sender.id == browser.runtime.id ) ) {
        port.onMessage.addListener(({ type, payload, uuid}) => {
            controller[type](payload).then((res) => {
                port.postMessage({ uuid, res })
            })
        })  
    }
})  

const notification = new Notification();
