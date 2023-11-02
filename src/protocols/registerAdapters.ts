import type { Class, Protocol } from '@/types';
import { PROTOCOL_AETERNITY, PROTOCOL_BITCOIN, PROTOCOL_ETHEREUM } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { AeternityAdapter } from '@/protocols/aeternity/libs/AeternityAdapter';
import { BitcoinAdapter } from '@/protocols/bitcoin/libs/BitcoinAdapter';
import { EthereumAdapter } from '@/protocols/ethereum/libs/EthereumAdapter';
import { BaseProtocolAdapter } from './BaseProtocolAdapter';

const protocolAdapters: Record<Protocol, Class<BaseProtocolAdapter>> = {
  [PROTOCOL_AETERNITY]: AeternityAdapter,
  [PROTOCOL_BITCOIN]: BitcoinAdapter,
  [PROTOCOL_ETHEREUM]: EthereumAdapter,
};

Object.entries(protocolAdapters).forEach(([protocol, adapter]) => {
  ProtocolAdapterFactory.registerAdapter(protocol as Protocol, adapter);
});
