import { DEFAULT_NETWORK, networks } from '../popup/utils/constants'
import { stringifyForStorage, parseFromStorage, extractHostName, getAeppAccountPermission } from '../popup/utils/helper'
import { getAccounts } from '../popup/utils/storage'
import MemoryAccount from '@aeternity/aepp-sdk/es/account/memory'
import { RpcWallet } from '@aeternity/aepp-sdk/es/ae/wallet'
import BrowserRuntimeConnection
  from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime'
import Node from '@aeternity/aepp-sdk/es/node'
import { detectBrowser } from '../popup/utils/helper'

global.browser = require('webextension-polyfill');

const rpcWallet = {
    sdk: null,
    network: DEFAULT_NETWORK,
    compiler: networks[DEFAULT_NETWORK].compilerUrl,
    internalUrl: networks[DEFAULT_NETWORK].internalUrl,
    activeAccount: null,
    subaccounts: null,
    accounts: [],
    accountKeyPairs: [],
    created: false,
    createInterval: null,
    controller: null,
    async init(walletController) {
        this.controller = walletController
        let { subaccounts } = await getAccounts()
        this.subaccounts = subaccounts

        this.createInterval = setInterval(async () => {
            if(this.controller.isLoggedIn()) {
                if(!this.created) {
                    this.recreateWallet()
                    clearInterval(this.createInterval)
                }
                this.created = true
            }
        }, 5000)
    },
    async createWallet() {
        this.accountKeyPairs = await Promise.all(this.subaccounts.map(async (a, index) => (
            parseFromStorage(await this.controller.getKeypair({ activeAccount: index, account: a}))
        )))
        
        let activeIdx = await browser.storage.sync.get('activeAccount') 
        
        this.accounts = this.accountKeyPairs.map((a) => {
            return MemoryAccount({
                keypair: a
            })
        })
        const context = this
        try {
            const node = await Node({ url: this.internalUrl, internalUrl: this.internalUrl })
            this.sdk  = await RpcWallet({
                nodes: [
                    { name: DEFAULT_NETWORK, instance: node },
                ],
                compilerUrl: this.compiler,
                name: 'Waellet',
                accounts:this.accounts,
                async onConnection (aepp, action) {
                    context.checkAeppPermissions(aepp, action, "connection")
                },
                onDisconnect (msg, client) {
                    client.disconnect()
                },
                async onSubscription (aepp, action) {
                    context.checkAeppPermissions(aepp, action, "subscription")
                },
                async onSign (aepp, action) {
                    context.checkAeppPermissions(aepp, action, "sign", () => {
                        setTimeout(() => {
                            context.showConnectionPopup({ aepp, action, type: "sign" })
                        }, 2000)
                        
                    })
                },
                onAskAccounts (aepp, { accept, deny }) {
                    if (confirm(`Client ${aepp.info.name} with id ${aepp.id} want to get accounts`)) {
                      accept()
                    } else {
                      deny()
                    }
                }
            })

            if (activeIdx.hasOwnProperty("activeAccount") && !isNaN(activeIdx.activeAccount)) {
                this.sdk.selectAccount(this.accountKeyPairs[activeIdx.activeAccount].publicKey)
                this.activeAccount = this.accountKeyPairs[activeIdx.activeAccount].publicKey
            } else {
                this.sdk.selectAccount(this.accountKeyPairs[0].publicKey)
                this.activeAccount = this.accountKeyPairs[0].publicKey
            }

        } catch(e) {
            console.error(e)
        }
        return this.sdk
    },
    sdkReady(cb) {
        let check = setInterval(() => {
            if(this.sdk) {
                cb()
                clearInterval(check)
            }
        },1000)
        return check
    },
    async checkAeppPermissions (aepp, action, caller, cb )  {
        let { connection: { port: {  sender: { url } } } } = aepp
        let isConnected = await getAeppAccountPermission(extractHostName(url), this.activeAccount)

        if(!isConnected) {
            try {
                let a = caller == "connection" ? action : {}
                let res = await this.showConnectionPopup({ action: a, aepp, type: "connectConfirm" })
                if(typeof cb != "undefined") {
                    cb()
                }
            } catch(e) {
                
            }
        } else {
            if (typeof cb == "undefined") {
                action.accept()
            } else {
                cb()
            }
        }
    },

    showConnectionPopup ({ action, aepp, type = "connectConfirm" })  {
        const popupWindow = window.open(`/popup/popup.html?t=${action.id}`, `popup_id_${action.id}`, 'width=420,height=680', false);
        if (!popupWindow) action.deny()
        let { connection: { port: {  sender: { url } } }, info: { icons, name} } = aepp
        let { protocol } = new URL (url)
        return new Promise((resolve, reject) => {
            popupWindow.window.props = { type, resolve, reject, action, host: extractHostName(url), icons, name, protocol };
        });
    },

    async addConnection(port) {
        const connection = await BrowserRuntimeConnection({ connectionInfo: { id: port.sender.frameId }, port })
        this.sdk.addRpcClient(connection)
        this.sdk.shareWalletInfo(port.postMessage.bind(port))
        setTimeout(() => this.sdk.shareWalletInfo(port.postMessage.bind(port)), 3000)
    },

    changeAccount(payload) {
        this.activeAccount = payload
        this.sdk.selectAccount(payload)
    },
    async addAccount(payload) {
        let account = {
            publicKey: payload.address
        }
        let newAccount =  MemoryAccount({
            keypair: parseFromStorage(await this.controller.getKeypair({ activeAccount: payload.idx, account }))
        })
        this.sdk.addAccount(newAccount, { select: true })
        this.activeAccount = payload.address
    },
    async switchNetwork(payload) {
        this.network = payload
        this.compiler = networks[this.network].compilerUrl
        this.internalUrl = networks[this.network].internalUrl
        const node = await Node({ url:this.internalUrl, internalUrl: this.internalUrl })
        try {
            await this.sdk.addNode(payload, node, true)
        } catch(e) {
            // console.log(e)
        }
        this.sdk.selectNode(this.network)
    },

    async recreateWallet() {
        await this.createWallet()
    }
}

export default rpcWallet