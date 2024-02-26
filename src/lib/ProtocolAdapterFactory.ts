import type {
  Class,
  NetworkType,
  Protocol,
  ProtocolRecord,
} from '@/types';
import { PROTOCOL_LIST } from '@/constants';
import { BaseProtocolAdapter } from '@/protocols/BaseProtocolAdapter';

/**
 * Encapsulates helper methods related to multiple protocol instances
 */
export const ProtocolAdapterFactory = (() => {
  /**
   * Registry of non instantiated classes.
   * Use the `addAdapter` instead of hardcoding the adapters here to avoid circular dependency.
   */
  const protocolAdapterClassRegistry: ProtocolRecord<Class<BaseProtocolAdapter>> = {};

  const protocolAdapterRegistry: ProtocolRecord<BaseProtocolAdapter> = {};

  function registerAdapter(protocol: Protocol, adapter: Class<BaseProtocolAdapter>) {
    protocolAdapterClassRegistry[protocol] = adapter;
  }

  /**
   * Get (and instantiate if needed) protocol adapter.
   */
  function getAdapter(protocol: Protocol): BaseProtocolAdapter {
    if (!protocolAdapterClassRegistry[protocol]) {
      throw new Error(`Protocol ${protocol} is not registered`);
    } if (!protocolAdapterRegistry[protocol]) {
      protocolAdapterRegistry[protocol] = new protocolAdapterClassRegistry[protocol]!();
    }
    return protocolAdapterRegistry[protocol]!;
  }

  /**
   * Go through all adapters one by one and try to validate the user account address.
   * Adapter that would return `true` will be returned.
   */
  function getAdapterByAccountAddress(
    address: string,
    networkType?: NetworkType,
  ): BaseProtocolAdapter | undefined {
    return PROTOCOL_LIST.reduce((returnData, protocol) => {
      if (!returnData) {
        const adapter = getAdapter(protocol);
        if (adapter.isAccountAddressValid(address, networkType)) {
          // eslint-disable-next-line no-param-reassign
          returnData = adapter;
        }
      }
      return returnData;
    }, undefined as undefined | BaseProtocolAdapter);
  }

  return {
    registerAdapter,
    getAdapter,
    getAdapterByAccountAddress,
  };
})();
