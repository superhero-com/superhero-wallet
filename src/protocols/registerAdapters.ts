import type { Class, Protocol } from '@/types';
import { PROTOCOLS } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { AeternityAdapter } from '@/protocols/aeternity/libs/AeternityAdapter';
import { BitcoinAdapter } from '@/protocols/bitcoin/libs/BitcoinAdapter';
import { EthereumAdapter } from '@/protocols/ethereum/libs/EthereumAdapter';
import { SolanaAdapter } from '@/protocols/solana/libs/SolanaAdapter';
import { BnbAdapter } from '@/protocols/bnb/libs/BnbAdapter';
import { AvalancheAdapter } from '@/protocols/avalanche/libs/AvalancheAdapter';
import { PolygonAdapter } from '@/protocols/polygonPos/libs/PolygonPosAdapter';
import { BaseProtocolAdapter } from './BaseProtocolAdapter';

const protocolAdapters: Record<Protocol, Class<BaseProtocolAdapter>> = {
  [PROTOCOLS.aeternity]: AeternityAdapter,
  [PROTOCOLS.bitcoin]: BitcoinAdapter,
  [PROTOCOLS.ethereum]: EthereumAdapter,
  [PROTOCOLS.solana]: SolanaAdapter,
  [PROTOCOLS.bnb]: BnbAdapter,
  [PROTOCOLS.avalanche]: AvalancheAdapter,
  [PROTOCOLS.polygonPos]: PolygonAdapter,
};

Object.entries(protocolAdapters).forEach(([protocol, adapter]) => {
  ProtocolAdapterFactory.registerAdapter(protocol as Protocol, adapter);
});
