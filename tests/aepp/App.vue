<template>
  <div>
    <p
      v-if="wallet.found"
      data-cy="wallet-found"
    >
      Wallet found
    </p>
    <div
      v-if="wallet.address && wallet.name"
      data-cy="wallet-info"
    >
      <p data-cy="wallet-address">
        {{ wallet.address }}
      </p>
      <p data-cy="wallet-balance">
        {{ wallet.balance }}
      </p>
      <p data-cy="wallet-name">
        {{ wallet.name }}
      </p>
      <button
        data-cy="wallet-sign-msg"
        @click="sign"
      >
        Sign Msg
      </button>
      <button
        data-cy="contract-call"
        @click="contractCall('statefull')"
      >
        Contract Call
      </button>
      <button
        data-cy="contract-call-static"
        @click="contractCall('static')"
      >
        Contract Call Static
      </button>
      <button
        data-cy="send"
        @click="spend"
      >
        Spend
      </button>
      <p
        v-if="message.valid"
        data-cy="message-valid"
      >
        {{ message.sig }}
      </p>
      <p
        v-if="contractCallRes"
        data-cy="contract-call-res"
      >
        {{ contractCallRes }}
      </p>
      <p
        v-if="contractCallStaticRes"
        data-cy="contract-call-static-res"
      >
        {{ contractCallStaticRes }}
      </p>
      <p
        v-if="sendRes"
        data-cy="send-res"
      >
        {{ sendRes }}
      </p>
    </div>
  </div>
</template>

<script>
import { RpcAepp, Node } from '@aeternity/aepp-sdk';
import Detector from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector';
import BrowserWindowMessageConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message';
import {
  NETWORK_MAINNET,
  NETWORK_TESTNET,
  NETWORK_NAME_MAINNET,
  NETWORK_NAME_TESTNET,
} from '../../src/popup/utils/constants';
import { recipientId, contractCallAddress } from '../../src/popup/utils/testsConfig';

const DEFAULT_NETWORKS = {
  [NETWORK_NAME_MAINNET]: NETWORK_MAINNET,
  [NETWORK_NAME_TESTNET]: NETWORK_TESTNET,
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
      contractAddress: contractCallAddress,
    };
  },
  async mounted() {
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
        url: DEFAULT_NETWORKS[process.env.NETWORK].url,
      });
      this.client = await RpcAepp({
        name: 'AEPP',
        nodes: [{ name: process.env.NETWORK, instance: node }],
        compilerUrl: DEFAULT_NETWORKS[process.env.NETWORK].compilerUrl,
        onNetworkChange(params) {
          if (this.getNetworkId() !== params.networkId) {
            // eslint-disable-next-line no-alert
            alert(
              `Connected network ${this.getNetworkId()} is not supported with wallet network ${
                params.networkId
              }`,
            );
          }
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
        recipientId,
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
