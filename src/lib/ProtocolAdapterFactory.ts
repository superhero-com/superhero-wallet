import type {
  Class,
  Protocol,
  ProtocolRecord,
} from '@/types';
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

  function getAdapter(protocol: Protocol): BaseProtocolAdapter {
    if (!protocolAdapterClassRegistry[protocol]) {
      throw new Error(`Protocol ${protocol} is not registered`);
    } if (!protocolAdapterRegistry[protocol]) {
      protocolAdapterRegistry[protocol] = new protocolAdapterClassRegistry[protocol]!();
    }
    return protocolAdapterRegistry[protocol]!;
  }

  return {
    registerAdapter,
    getAdapter,
  };
})();
