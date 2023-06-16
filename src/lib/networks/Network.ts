import {
  computed,
  reactive,
  ref,
} from '@vue/composition-api';
import type {
  IAccount,
  INetworkAdapter,
  INetworkFeatures,
  INetworkInstance,
  INetworkMethods,
  INetworkSettings,
  INetworkState,
  SupportedNetworkType,
} from '../../types';
import { AeternityNetwork } from './aeternity/AeternityAdapter';
import { NETWORK_MAINNET, NETWORK_TESTNET } from '../../popup/utils';
import { useModals } from '../../composables';

export const Network = (() => {
  const { openDefaultModal } = useModals();

  const networkAdapters: Record<SupportedNetworkType, INetworkAdapter> = {
    aeternity: AeternityNetwork,
    bitcoin: AeternityNetwork, // TODO for testing purposes
  };

  const networkSettingsList = ref<INetworkSettings[]>([
    { ...NETWORK_MAINNET, type: 'aeternity' },
    { ...NETWORK_TESTNET, type: 'aeternity' },
    { ...NETWORK_MAINNET, type: 'bitcoin', name: 'BTC Test' }, // TODO for testing purposes
  ]);

  function getEmptyNetworkState(): INetworkState {
    return {
      isReady: ref(false),
      isConnected: ref(false),
      isError: ref(false),
      accounts: ref([]),
      activeAccountIdx: ref(0),
      activeAccount: computed(() => ({} as IAccount)),
      features: {} as INetworkFeatures,
    };
  }

  const activeNetworkIdx = ref<number>();
  const networkState = reactive<INetworkState>(getEmptyNetworkState());

  let networkInstance: INetworkInstance;

  /**
   * Proxy interface that allows to run currently used network's methods.
   * Trying to run any method without established connection will throw an error.
   * Also we check if the network has requested method available.
   */
  const networkMethods = new Proxy({} as INetworkMethods, {
    get(target, methodName) {
      if (!networkInstance) {
        openDefaultModal({ msg: 'Not connected' });
        throw new Error('Not connected');
      } else if (!(networkInstance.methods as any)[methodName]) {
        openDefaultModal({ msg: `Active network does not allow to use ${String(methodName)}` });
        throw new Error('Method not available on current network');
      }
      return (networkInstance.methods as any)[methodName];
    },
  });

  /**
   * As the state is using the `reactive` to replace the whole state we need to use `Object.assign`.
   * The new state should have the same structure as the previous one
   * or the properties won't be assigned.
   */
  function setNetworkState(state: INetworkState) {
    Object.assign(networkState, state);
  }

  /**
   * Change currently used network.
   * If the new network has the same type as the previous the adapter stays the same,
   * but it needs to be reset.
   */
  function change(idx: number) {
    const currentNetworkSettings = (activeNetworkIdx.value !== undefined)
      ? networkSettingsList.value[activeNetworkIdx.value]
      : null;
    const newNetworkSettings = networkSettingsList.value[idx];

    if (newNetworkSettings && networkAdapters[newNetworkSettings.type]) {
      activeNetworkIdx.value = idx;
      const adapter = networkAdapters[newNetworkSettings.type];

      if (currentNetworkSettings && currentNetworkSettings.type === newNetworkSettings.type) {
        networkInstance.reset(newNetworkSettings);
      } else {
        networkInstance = adapter();
        const newNetworkState = networkInstance.init(newNetworkSettings);
        setNetworkState(newNetworkState);
      }
    } else {
      setNetworkState(getEmptyNetworkState());
      throw new Error('Unknown network');
    }
  }

  /**
   * Add new custom network to the app.
   * TODO: Requires validation/local storage syncing etc...
   */
  function add(networkSettings: INetworkSettings) {
    networkSettingsList.value.push(networkSettings);
  }

  return {
    list: networkSettingsList,
    current: {
      idx: activeNetworkIdx,
      state: networkState,
      methods: networkMethods,
    },
    change,
    add,
  };
})();
