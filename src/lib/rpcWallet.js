import { DEFAULT_NETWORK, networks, AEX2_METHODS } from '../popup/utils/constants'
import { stringifyForStorage, parseFromStorage, extractHostName, getAeppAccountPermission, getUniqueId, getUserNetworks } from '../popup/utils/helper'
import { getAccounts } from '../popup/utils/storage'
import MemoryAccount from '@aeternity/aepp-sdk/es/account/memory'
import { RpcWallet } from '@aeternity/aepp-sdk/es/ae/wallet'
import BrowserRuntimeConnection
  from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime'
import Node from '@aeternity/aepp-sdk/es/node'
import { detectBrowser } from '../popup/utils/helper'

global.browser = require('webextension-polyfill');

const rpcWallet = {
    async init(walletController) {
        await this.initNodes()
        this.initFields()
        this.controller = walletController
    },
    async initSubaccounts() {
        let { subaccounts } = await getAccounts()
        this.subaccounts = subaccounts
        return Promise.resolve(true)
    },
    initSdk() {
        this.recreateWallet()
    },
    initFields() {
        this.sdk = null
        this.initNetwork()
        this.activeAccount = null
        this.subaccounts = null
        this.accounts = []
        this.accountKeyPairs = []
    },
    initNetwork(network = DEFAULT_NETWORK) {
        this.network = network
        this.compiler = this.nodes[network].compilerUrl
        this.internalUrl = this.nodes[network].internalUrl
    },
    async initNodes() {
        const userNetworks = await getUserNetworks()
        const nodes = { ...networks, ...userNetworks }
        this.nodes = nodes
        return Promise.resolve(true)
    },
    async createWallet() {
        this.accountKeyPairs = await Promise.all(this.subaccounts.map(async (a, index) => (
            parseFromStorage(await this.controller.getKeypair({ activeAccount: index, account: a}))
        )))
        
        // let activeIdx = await browser.storage.local.get('activeAccount') 
        
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
                            context.showPopup({ aepp, action, type: "sign" })
                        }, 2000)
                        
                    })
                },
                onAskAccounts (aepp, action) {
                    context.checkAeppPermissions(aepp, action, "accounts", () => {
                        setTimeout(() => {
                            context.showPopup({ aepp, action, type: "askAccounts" })
                        }, 2000)
                    })
                }
            })

            if (!this.activeAccount) {
                this.sdk.selectAccount(this.accountKeyPairs[0].publicKey)
                this.activeAccount = this.accountKeyPairs[0].publicKey
            } 

        } catch(e) {
            this.sdk = null
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
                let res = await this.showPopup({ action: a, aepp, type: "connectConfirm" })
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

    showPopup ({ action, aepp, type = "connectConfirm" })  {
        const uid = getUniqueId()
        const time = `${Math.floor(Date.now() / 1000)}${uid}`
        const popupWindow = window.open(`/popup/popup.html?t=${time}`, `popup_id_${time}`, 'width=420,height=680', false);
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
    getClientsByCond(condition) {
        const clients = Array.from(
            this.sdk.getClients().clients.values()
        )
        .filter(condition)
        return clients
    },
    getAccessForAddress(address) {
        const clients = this.getClientsByCond((client) => client.isConnected())
        const context = this
        clients.forEach(async (client) => {
            let { connection: { port: {  sender: { url } } } } = client
            let isConnected = await getAeppAccountPermission(extractHostName(url), address)
            if (!isConnected) {
                let accept = await this.showPopup({ action: { }, aepp:client, type: "connectConfirm" })
                if(accept) {
                    this.sdk.selectAccount(address)
                }
            } else {
                this.sdk.selectAccount(address)
            }
        })
    },
    [AEX2_METHODS.CHANGE_ACCOUNT](payload) {
        this.activeAccount = payload
        this.getAccessForAddress(payload)
    },
    async [AEX2_METHODS.ADD_ACCOUNT](payload) {
        let account = {
            publicKey: payload.address
        }
        let newAccount =  MemoryAccount({
            keypair: parseFromStorage(await this.controller.getKeypair({ activeAccount: payload.idx, account }))
        })
        this.sdk.addAccount(newAccount)
        this.activeAccount = payload.address
        this.getAccessForAddress(payload.address)
    },
    async [AEX2_METHODS.SWITCH_NETWORK](payload) {
        this.addNewNetwork(payload)
    },
    async addNewNetwork(network) {
        this.initNetwork(network)
        const node = await Node({ url:this.internalUrl, internalUrl: this.internalUrl })
        if(this.sdk) {
            try {
                await this.sdk.addNode(network, node, true)
            } catch(e) {
                // console.log(e)
            }
            this.sdk.selectNode(network)
        }
        
    },
    async [AEX2_METHODS.LOGOUT]() {
        this.controller.lockWallet()
        this.initFields()
    },
    async [AEX2_METHODS.INIT_RPC_WALLET]({ address, network }) {
        this.activeAccount = address
        if(!this.nodes.hasOwnProperty(network)) {
            await this.initNodes()
        }
        if(this.sdk) {
            this.sdk.selectAccount(this.activeAccount)
            if(this.network !== network) {
                this.addNewNetwork(network)
            }
        }else {
            this.initNetwork(network)
            await this.initSubaccounts()
            this.initSdk()
        }
    },
    async recreateWallet() {
        await this.createWallet()
    }
}

export default rpcWallet