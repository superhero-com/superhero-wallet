import { computed, ref } from '@vue/composition-api';
import { AeSdkWallet, Node, WALLET_TYPE } from '@aeternity/aepp-sdk-13';
import type {
  IAccount,
  INetwork,
  INetworkState,
  INetworkFeatures,
  INetworkAdapter,
  INetworkMethods,
} from '../../../types';
import * as composables from './composables';

export const AeternityNetwork: INetworkAdapter = () => {
  let activeNetworkSettings: INetwork;

  const features: INetworkFeatures = Object.freeze({
    names: true,
    tipping: true,
  });

  const isReady = ref(false);
  const isConnected = ref(false);
  const isError = ref(false);
  const accounts = ref<IAccount[]>([
    // Example test data
    { address: 'AAAAA' } as IAccount,
    { address: 'BBBBB' } as IAccount,
  ]);
  const activeAccountIdx = ref(0);
  const activeAccount = computed((): IAccount => accounts.value[activeAccountIdx.value] || {});

  let sdk: AeSdkWallet;
  let nodeStatus: any;

  async function createNodeInstance() {
    const nodeInstance = new Node(activeNetworkSettings.url, { ignoreVersion: true });
    nodeStatus = await nodeInstance.getStatus();
    return nodeInstance;
  }

  /**
   * Create SDK instance.
   * TODO shortened version for the POC
   */
  async function initializeSdk() {
    const nodeInstance = await createNodeInstance();

    sdk = new AeSdkWallet({
      id: 'Superhero Wallet',
      type: WALLET_TYPE.extension,
      name: 'test',
      nodes: [{
        name: 'TEST',
        instance: nodeInstance,
      }],
      onConnection: () => {},
      onSubscription: () => {},
      onAskAccounts: () => {},
      onDisconnect: () => {},
    });

    isReady.value = true;
    isConnected.value = true;
  }

  /**
   * Leave the SDK instance and only replace the Node.
   */
  async function resetSdkNode(oldNetwork: INetwork) {
    sdk.pool.delete(oldNetwork.name);
    const nodeInstance = await createNodeInstance();
    sdk.addNode(activeNetworkSettings.name, nodeInstance!, true);
  }

  /**
   * Fired when the user changes the network to this one from different type.
   */
  function init(network: INetwork): INetworkState {
    activeNetworkSettings = network;

    initializeSdk();

    return {
      isReady,
      isConnected,
      isError,
      accounts,
      activeAccountIdx,
      activeAccount,
      features,
    };
  }

  /**
   * Fired when the user changes to another network of the same type as the current one.
   */
  function reset(newNetworkSettings: INetwork) {
    const oldNetworkSettings = activeNetworkSettings;
    activeNetworkSettings = newNetworkSettings;

    resetSdkNode(oldNetworkSettings);
  }

  /**
   * Public methods for the network
   */
  const methods: INetworkMethods = {
    testMethod: (num: Number) => {
      console.log('Test method!', num, nodeStatus);
    },
  };

  return {
    init,
    reset,
    methods,
    composables,
  };
};
