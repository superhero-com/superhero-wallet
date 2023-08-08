import type {
  Class,
  Protocol,
} from '@/types';
import { BaseProtocolAdapter } from '@/protocols/BaseProtocolAdapter';
import { AeternityAdapter } from '@/protocols/aeternity/libs/AeternityAdapter';
import { BitcoinAdapter } from '@/protocols/bitcoin/libs/BitcoinAdapter';
import {
  PROTOCOL_AETERNITY,
  PROTOCOL_BITCOIN,
} from '@/constants';

/**
 * Encapsulates helper methods related to multiple protocol instances
 */
export const ProtocolAdapterFactory = (() => {
  const protocolAdapterClassRegistry: Record<Protocol, Class<BaseProtocolAdapter> > = {
    [PROTOCOL_AETERNITY]: AeternityAdapter,
    [PROTOCOL_BITCOIN]: BitcoinAdapter,
  };

  const protocolAdapterRegistry: Partial<Record<Protocol, BaseProtocolAdapter>> = {};

  function getAdapter(protocol: Protocol): BaseProtocolAdapter {
    if (!protocolAdapterRegistry[protocol]) {
      protocolAdapterRegistry[protocol] = new protocolAdapterClassRegistry[protocol]();
    }
    return protocolAdapterRegistry[protocol]!;
  }

  return {
    getAdapter,
  };
})();
