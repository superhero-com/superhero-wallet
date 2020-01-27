import { networks } from './constants'
import Universal from '@aeternity/aepp-sdk/es/ae/universal';
import { setContractInstance, contractCall, parseFromStorage } from './helper'

let sdk;
let controller;

export const setController = (contr) => {
    controller = contr;
}

export const getActiveAccount  = () => {
    return new Promise((resolve, rejet) => {
        browser.storage.local.get('isLogged').then((data) => {
            if (data.isLogged && data.hasOwnProperty('isLogged')) {
                browser.storage.local.get('subaccounts').then((subaccounts) => {
                    browser.storage.local.get('activeAccount').then((active) => {
                        let activeIdx = 0
                        if(active.hasOwnProperty("activeAccount")) {
                            activeIdx = active.activeAccount
                        }
                        let address = subaccounts.subaccounts[activeIdx].publicKey
                        resolve({ account: { publicKey: address }, activeAccount: activeIdx })
                    })
                })
            } else {
                resolve(false)
            }
        })
    })
}

export const getActiveNetwork = async () => {
    const { activeNetwork } = await browser.storage.local.get('activeNetwork')
    return networks[activeNetwork ? activeNetwork : 'Testnet']
}

export const getSDK = async (keypair) => {
    if(!sdk) {
        try {
            let network = await getActiveNetwork();
            sdk = await Universal({
                url: network.url , 
                internalUrl: network.internalUrl,
                keypair,
                networkId: network.networkId, 
                nativeMode: true,
                compilerUrl: network.compilerUrl
            })
        } catch(e) { } 
    } 

    return sdk
    
}

export const contractCallStatic = async ({ tx, callType }) => {
    
    return new Promise(async (resolve, reject) => {
        try {
            let { activeAccount, account } = await getActiveAccount();
            if(controller.isLoggedIn() && typeof callType != "undefined" && callType == 'static' ) {
                let keypair = parseFromStorage(await controller.getKeypair({ activeAccount, account }));
                let sdk = await getSDK(keypair);
                let contractInstance = await setContractInstance(tx, sdk, tx.address)
                let call = await contractCall({ instance:contractInstance, method:tx.method, params:[...tx.params, tx.options] })
                if(call) {
                    resolve(call)
                } else {
                    reject("Contract call failed")
                }
            } else if(!controller.isLoggedIn() && typeof callType != "undefined" && callType == 'static') { 
                reject("You need to unlock the wallet first")
            }
        } catch(e) {
            reject(e)
        }
    })
}