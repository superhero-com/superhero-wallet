<template>
  <div>
    <div v-if="wallet.address">
      <p data-cy="wallet-address">{{ wallet.address }}</p>
      <p data-cy="wallet-balance">{{ wallet.balance }}</p>
      <p data-cy="wallet-name">{{ wallet.name }}</p>
      <button data-cy="wallet-sign-msg" @click="sign">Sign Msg</button>
      <p data-cy="message-valid" v-if="message.valid">{{ message.sig }}</p>
    </div>
    
  </div>
</template>

<script>
import { RpcAepp } from '@aeternity/aepp-sdk/es'
import Detector from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector'
import BrowserWindowMessageConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message'
import Node from '@aeternity/aepp-sdk/es/node'
const networks = {
  'Mainnet': {
    NODE_URL: 'https://mainnet.aeternal.io',
    NODE_INTERNAL_URL: 'https://mainnet.aeternal.io',
    COMPILER_URL: 'https://compiler.aepps.com'
  },
  'Testnet': {
    NODE_URL: 'https://testnet.aeternal.io',
    NODE_INTERNAL_URL: 'https://testnet.aeternal.io',
    COMPILER_URL: 'https://latest.compiler.aepps.com'
  }
}
export default {
  name: 'App',
  data () {
      return {
        runningInFrame: window.parent !== window,
        client: null,
        wallet: {
          address:null,
          balance:0,
          name:null
        },
        message: {
          valid:false,
          sig:null
        }
      }
  },
  async created () {
      window !== window.parent || await this.getReverseWindow()
      const node = await Node({ url: networks[process.env.NETWORK].NODE_URL, internalUrl:  networks[process.env.NETWORK].NODE_INTERNAL_URL })
      this.client = await RpcAepp({
        name: 'AEPP',
        nodes: [
            { name: process.env.NETWORK, instance: node },
        ],
        compilerUrl: networks[process.env.NETWORK].COMPILER_URL,
        onNetworkChange (params) {
          if (this.getNetworkId() !== params.networkId) alert(`Connected network ${this.getNetworkId()} is not supported with wallet network ${params.networkId}`)
        },
        onAddressChange:  async (addresses) => {
          this.wallet.address = await this.client.address()
          this.wallet.balance = await this.client.balance(this.pub).catch(e => '0')
        },
        onDisconnect (a) {
        }
      })
      this.height = await this.client.height()
      console.log("client", this.client)
      await this.scanForWallets()
    },
    methods: {
      async sign() {
        this.message.sig = await this.client.signMessage('test');
        this.message.valid = await this.client.verifyMessage('test', this.message.sig)
      },
      async getReverseWindow() {
        const iframe = document.createElement('iframe')
        // iframe.src = prompt('Enter wallet URL', 'http://localhost:9000')
        iframe.src = ''
        iframe.style.display = 'none'
        document.body.appendChild(iframe)
        return iframe.contentWindow
      },
      async connectToWallet (wallet) {
        await this.client.connectToWallet(await wallet.getConnection())
        this.accounts = await this.client.subscribeAddress('subscribe', 'connected')
        const address = await this.client.address()
        this.wallet = {
          address,
          balance :await this.client.getBalance(address),
          name:this.client.rpcClient.info.name
        }
      },
      async scanForWallets () {
        try {
          const handleWallets = async function ({ wallets, newWallet }) {
            console.log("wallets", wallets)
            newWallet = newWallet || Object.values(wallets)[0]
            // if (confirm(`Do you want to connect to wallet ${newWallet.name}`)) {
              
            // }
            this.detector.stopScan()
            
            await this.connectToWallet(newWallet)
            // let addr = await this.client.askAddresses()
          }

          const scannerConnection = await BrowserWindowMessageConnection({
            connectionInfo: { id: 'spy' }
          })
          console.log(scannerConnection)
          this.detector = await Detector({ connection: scannerConnection })
          this.detector.scan(handleWallets.bind(this))
          console.log(this.detector)
        } catch(e) {
          console.log(e)
        }
        
      }
    
    }
};
</script>

<style scoped>
p {
  font-size: 20px;
}
</style>
