<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <div>
    <p data-cy="wallet-found" v-if="wallet.found">Wallet found</p>
    <div v-if="wallet.address && wallet.name" data-cy="wallet-info">
      <p data-cy="wallet-address">{{ wallet.address }}</p>
      <p data-cy="wallet-balance">{{ wallet.balance }}</p>
      <p data-cy="wallet-name">{{ wallet.name }}</p>
      <button data-cy="wallet-sign-msg" @click="sign">Sign Msg</button>
      <button data-cy="contract-call" @click="contractCall('statefull')">Contract Call</button>
      <button data-cy="contract-call-static" @click="contractCall('static')">
        Contract Call Static
      </button>
      <button data-cy="send" @click="spend">Spend</button>
      <p data-cy="message-valid" v-if="message.valid">{{ message.sig }}</p>
      <p data-cy="contract-call-res" v-if="contractCallRes">{{ contractCallRes }}</p>
      <p data-cy="contract-call-static-res" v-if="contractCallStaticRes">
        {{ contractCallStaticRes }}
      </p>
      <p data-cy="send-res" v-if="sendRes">{{ sendRes }}</p>
    </div>
  </div>
</template>

<script>
import { RpcAepp } from '@aeternity/aepp-sdk/es';
import Detector from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector';
import BrowserWindowMessageConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message';
import Node from '@aeternity/aepp-sdk/es/node';

const networks = {
  Mainnet: {
    NODE_URL: 'https://mainnet.aeternity.io',
    COMPILER_URL: 'https://compiler.aepps.com',
  },
  Testnet: {
    NODE_URL: 'https://testnet.aeternity.io',
    COMPILER_URL: 'https://latest.compiler.aepps.com',
  },
};
export default {
  name: 'App',
  data() {
    return {
      runningInFrame: window.parent !== window,
      client: null,
      wallet: {
        address: null,
        balance: 0,
        name: null,
        found: false,
      },
      message: {
        valid: false,
        sig: null,
      },
      contractCallRes: null,
      contractCallStaticRes: null,
      sendRes: null,
      contractCode: `@compiler >= 4
contract Example =
  record state = { b: bytes(32) }
  entrypoint init() : state = { b = #aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa }
  entrypoint get_bytes() : bytes(32) = state.b
  stateful entrypoint set_bytes(x: bytes(32)) = put(state{ b = x })`,
      contractAddress: 'ct_ym8eXWR2YfQZcMaXA8GFid9aarfCozGkeMcRHYVCVoBdVMzio',
    };
  },
  async created() {
    this.initClient();
    setInterval(async () => {
      if (this.client && !this.wallet.found) {
        await this.scanForWallets();
      }
    }, 2500);
  },
  methods: {
    async initClient() {
      const node = await Node({
        url: networks[process.env.NETWORK].NODE_URL,
      });
      this.client = await RpcAepp({
        name: 'AEPP',
        nodes: [{ name: process.env.NETWORK, instance: node }],
        compilerUrl: networks[process.env.NETWORK].COMPILER_URL,
        onNetworkChange(params) {
          if (this.getNetworkId() !== params.networkId)
            alert(
              `Connected network ${this.getNetworkId()} is not supported with wallet network ${
                params.networkId
              }`,
            );
        },
        onAddressChange: async () => {
          this.wallet.address = await this.client.address();
          this.wallet.balance = await this.client.balance(this.pub).catch(() => 0);
        },
        onDisconnect() {},
      });
    },
    async spend() {
      const spend = await this.client.spend(
        1000000000000000,
        'ak_2ELPCWzcTdiyYuumjaV4D7kE843d1Ts27zH1Y2LBMKDbNtfq1Q',
        { payload: '' },
      );
      if (spend.hash) {
        this.sendRes = spend;
      }
    },
    async contractCall(type) {
      const compile = (await this.client.contractCompile(this.contractCode)).bytecode;
      const deploy = await this.client.contractDeploy(compile, this.contractCode, []);
      if (type === 'statefull') {
        const result = await this.client.contractCall(
          this.contractCode,
          deploy.address,
          'set_bytes',
          ['#aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'],
        );
        if (result.hash) {
          this.contractCallRes = result;
        }
      } else if (type === 'static') {
        const result = await this.client.contractCall(
          this.contractCode,
          deploy.address,
          'get_bytes',
          [],
        );
        if (result.hash) {
          this.contractCallStaticRes = result;
        }
      }
    },
    async sign() {
      this.message.sig = await this.client.signMessage('test');
      this.message.valid = await this.client.verifyMessage('test', this.message.sig);
    },
    async connectToWallet(wallet) {
      await this.client.connectToWallet(await wallet.getConnection());
      this.accounts = await this.client.subscribeAddress('subscribe', 'connected');
      const address = await this.client.address();
      this.wallet = {
        address,
        balance: await this.client.getBalance(address),
        name: this.client.rpcClient.info.name,
        found: true,
      };
    },
    async scanForWallets() {
      const handleWallets = async ({ wallets, newWallet }) => {
        const wallet = newWallet || Object.values(wallets)[0];
        this.detector.stopScan();

        await this.connectToWallet(wallet);
        // let addr = await this.client.askAddresses()
      };

      const scannerConnection = await BrowserWindowMessageConnection({
        connectionInfo: { id: 'spy' },
      });
      this.detector = await Detector({ connection: scannerConnection });
      this.detector.scan(handleWallets);
    },
  },
};
</script>

<style scoped>
p {
  font-size: 20px;
}
</style>
