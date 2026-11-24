import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { ACCOUNT_TYPES, PROTOCOLS } from '@/constants';
import type { IAccountRaw } from '@/types';
import { RFC8032_TEST1_PUBLIC_KEY } from '../../../../fixtures/privateKeyVectors';

const ADDRESS = 'ak_2dqvheyJXzEYpywfm8g7TshzLbaXWTwHKQPkh4rYX3Db2B3TPZ';
const PUBLIC_KEY = Buffer.from(RFC8032_TEST1_PUBLIC_KEY, 'hex');

const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.aeternity);

describe('AeternityAdapter device accounts', () => {
  it('resolves an AirGap account without a key', () => {
    const rawAccount: IAccountRaw = {
      address: ADDRESS,
      type: ACCOUNT_TYPES.airGap,
      publicKey: 'ab'.repeat(32),
      protocol: PROTOCOLS.aeternity,
      isRestored: false,
    };

    expect(adapter.resolveAccountRaw(rawAccount, 1, 5)).toStrictEqual({
      globalIdx: 5,
      idx: 1,
      address: ADDRESS,
      type: ACCOUNT_TYPES.airGap,
      publicKey: PUBLIC_KEY,
      protocol: PROTOCOLS.aeternity,
      isRestored: false,
    });
  });

  it('resolves a Ledger account without a key, keeping its device index', () => {
    const rawAccount: IAccountRaw = {
      idx: 3,
      address: ADDRESS,
      type: ACCOUNT_TYPES.ledger,
      publicKey: ADDRESS,
      protocol: PROTOCOLS.aeternity,
      isRestored: false,
    };

    expect(adapter.resolveAccountRaw(rawAccount, 1, 5)).toStrictEqual({
      globalIdx: 5,
      idx: 3,
      address: ADDRESS,
      type: ACCOUNT_TYPES.ledger,
      publicKey: PUBLIC_KEY,
      protocol: PROTOCOLS.aeternity,
      isRestored: false,
    });
  });
});
