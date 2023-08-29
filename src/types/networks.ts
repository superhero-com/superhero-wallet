import type { Protocol } from '@/types';
import {
  NETWORK_TYPE_CUSTOM,
  NETWORK_TYPE_MAINNET,
  NETWORK_TYPE_TESTNET,
} from '@/constants';

export type NetworkTypeDefault = typeof NETWORK_TYPE_MAINNET | typeof NETWORK_TYPE_TESTNET;
export type NetworkType = NetworkTypeDefault | typeof NETWORK_TYPE_CUSTOM;

/**
 * List of required network settings for each of the protocols
 */
export type NetworkProtocolSettingsRequired = 'nodeUrl';

/**
 * Every protocol besides the required settings can have it's own set of settings.
 * By default it's just a dictionary, but for the protocol-specific situations
 * we can narrow the list by pass the a list of the property names.
 */
export type INetworkProtocolSettings<T extends string = string> =
  Record<NetworkProtocolSettingsRequired, string>
  & Record<T, string>;

export type NetworkProtocolsSettings = Record<Protocol, INetworkProtocolSettings>;

export interface INetwork {
  index?: number;
  /**
   * 'Mainnet', 'Testnet' or unique name provided by the user when using custom network.
   */
  name: string;
  /**
   * Separate settings for each of the protocols.
   */
  protocols: NetworkProtocolsSettings;
  type: NetworkType;
}

export interface IAdapterNetworkSetting<T = string> {
  key: T;
  /**
   * Value used to fill the empty input when creating new custom network.
   */
  defaultValue?: string;
  getPlaceholder: () => string;
  getLabel: () => string;
  /**
   * Value used in automated tests. Remember to update the test cases when changing it.
   */
  testId?: string;
  required?: boolean;
}

export type AdapterNetworkSettingList<T = string> =
  IAdapterNetworkSetting<T | NetworkProtocolSettingsRequired>[];

export type IDefaultNetworkTypeData<T = any> = Record<NetworkTypeDefault, T>;

export type INetworkTypeProtocolDefaultSettings<T extends string = string> =
  IDefaultNetworkTypeData<INetworkProtocolSettings<T>>;
