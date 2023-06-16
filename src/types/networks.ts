import { ComputedRef, Ref } from '@vue/composition-api';
import type { IAccount } from '.';

export type SupportedNetworkType = 'aeternity' | 'bitcoin'; // TODO add 'dogecoin';

export interface INetworkBase {
  url: string
  name: string
  middlewareUrl: string
  networkId: string
  compilerUrl: string
  backendUrl: string
  index?: number
}

// TODO replace with INetworkSettings
export interface INetwork extends INetworkBase {
  explorerUrl: string;
  tipContractV1: string;
  tipContractV2?: string;
  multisigBackendUrl: string;
}

export interface INetworkSettings extends INetwork {
  type: SupportedNetworkType;
}

/**
 * List of the values that describes what features are available for the chosen network.
 */
export interface INetworkFeatures {
  names: Boolean;
  tipping: Boolean;
}

export interface INetworkState {
  isReady: Ref<Boolean>;
  isConnected: Ref<Boolean>;
  isError: Ref<Boolean>;
  accounts: Ref<IAccount[]>;
  activeAccountIdx: Ref<number>;
  activeAccount: ComputedRef<IAccount>;
  features: INetworkFeatures;
}

export interface INetworkMethods {
  testMethod: (...args: any) => any,
}

export interface INetworkComposables {
  useCoin: () => any;
}

export interface INetworkInstance {
  init(n: INetwork): INetworkState;
  reset(n: INetwork): void;
  methods: INetworkMethods;
  composables: INetworkComposables;
}

export type INetworkAdapter = () => INetworkInstance;
