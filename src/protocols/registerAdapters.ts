import { PROTOCOL_AETERNITY, PROTOCOL_BITCOIN } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { AeternityAdapter } from '@/protocols/aeternity/libs/AeternityAdapter';
import { BitcoinAdapter } from '@/protocols/bitcoin/libs/BitcoinAdapter';

ProtocolAdapterFactory.registerAdapter(PROTOCOL_AETERNITY, AeternityAdapter);
ProtocolAdapterFactory.registerAdapter(PROTOCOL_BITCOIN, BitcoinAdapter);
