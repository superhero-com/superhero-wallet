import uuid from 'uuid';
global.browser = require('webextension-polyfill');

export const start = async (browser) =>  {
    
    return browser.runtime.connect({ name: 'popup' })
}

export const postMesssage = async (connection, { type, payload }) => {
    let id = uuid()
    connection.postMessage({ type, payload, uuid:id  })
    return new Promise((resolve, reject) => {
        connection.onMessage.addListener((msg) => {
            if(msg.uuid == id) {
                resolve(msg)
            }
        })
    })
}

export const setMessageListener = async (cb) => {
    browser.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        cb(message, sender, sendResponse)
    });
}

export const readWebPageDom = (cb) => {
    setMessageListener((message, sender, sendResponse) => {
        if(typeof message.from != "undefined" && message.from == "content" && typeof message.type != "undefined" && message.type == "readDom" && sender.id == browser.runtime.id) {
            cb({ address: message.data, host:sender.url }, sendResponse)
        }
    })
}