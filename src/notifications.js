global.browser = require('webextension-polyfill');
const { Universal: Ae, Crypto } = require('@aeternity/aepp-sdk')
import { networks } from './popup/utils/constants';
import { detectBrowser } from './popup/utils/helper';

export default class Notification {

    constructor() {
        this.init()
    }

    async init() {
        let { activeNetwork } = await browser.storage.local.get('activeNetwork')
        this.network = networks.Testnet
        if(typeof activeNetwork != "undefined") {
            this.network = networks[activeNetwork]
        }
        this.client = await Ae({
            url: this.network.url,
            internalUrl: this.network.internalUrl,
            networkId: this.network.networkId,
            compilerUrl: this.network.compilerUrl
        })
        
        setInterval(() => {
            this.checkTxReady();
        },2000)
        browser.notifications.onButtonClicked.addListener((id) => {
            console.log(id)
            browser.tabs.create({url: id.split('?')[1], active: true});
        })

    }

    async getAllNotifications() {
        let { processingTx } = await browser.storage.local.get('processingTx');
        return processingTx;
    }

    async deleteNotification(tx) {
        let { processingTx } = await browser.storage.local.get('processingTx');
        let list = [
            ...processingTx
        ];
        list = list.filter(t => t != tx)
        await browser.storage.local.set({ processingTx: list })
    }
    
    async checkTxReady () {
        let noties = await this.getAllNotifications()
        if(noties) {
            noties.forEach(async (tx, index ) => {
                if (tx != "error" && tx) {
                    let res = await this.client.poll(tx)
                    let url = this.network.explorerUrl + '/transactions/' + tx
                    await this.sendNoti({ title: 'Transaction ready', message: `You can expore your transaction by clicking button below`, contextMessage: url, error:false})
                } else {
                    await this.sendNoti({ title: 'Transaction error', message: 'Transaction cannot be processed ', error:true })
                }
                
                await this.deleteNotification(tx)
            })
            
        }
        
    }
    
    async sendNoti ({ title, message, contextMessage, error }) {
        let params = {
            'type': 'basic',
            'title': title,
            'iconUrl':browser.runtime.getURL('../../../icons/icon_48.png'),
            'message': message,
            'priority': 2,
            
        }
        if(detectBrowser() != 'Firefox') {
            if(!error) {
                params = {
                    ...params,
                    'buttons': [
                        { title: 'See transaction details' }
                    ]
                }
            }
        }

        let noti = await browser.notifications.create(`popup.html?${contextMessage}`,params )
       
        return Promise.resolve(true)

    }
    
}

