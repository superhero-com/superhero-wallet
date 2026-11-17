import { encode, Encoding, MemoryAccount } from '@aeternity/aepp-sdk';

import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { ACCOUNT_TYPES, PROTOCOLS } from '@/constants';
import type { IAccountRaw } from '@/types';
import { RFC8032_TEST1_PUBLIC_KEY } from '../../../../fixtures/privateKeyVectors';

const SEED_HEX = '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60';
const LEGACY_HEX = SEED_HEX + RFC8032_TEST1_PUBLIC_KEY;
const SECRET_KEY = 'sk_2CK6vgUFHBTWVA9bMakzaB94Fhjuhwi4K6zQWU7tU8nKQ14rhM';
const ADDRESS = 'ak_2dqvheyJXzEYpywfm8g7TshzLbaXWTwHKQPkh4rYX3Db2B3TPZ';

const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.aeternity);

function resolve(privateKey: unknown) {
  return adapter.resolveAccountRaw({
    type: ACCOUNT_TYPES.privateKey,
    isRestored: false,
    protocol: PROTOCOLS.aeternity,
    privateKey,
  } as IAccountRaw, 0, 0);
}

describe('AeternityAdapter private keys', () => {
  it.each([
    ['sk_', SECRET_KEY],
    ['seed hex', SEED_HEX],
    ['legacy hex', LEGACY_HEX],
    ['upper case hex', LEGACY_HEX.toUpperCase()],
    ['sk_ in whitespace', ` ${SECRET_KEY}\n`],
    ['hex in whitespace', `\t${SEED_HEX} \r\n`],
  ])('parses %s', (_, input) => {
    const privateKey = adapter.parsePrivateKey(input);

    expect(Buffer.from(privateKey).toString('hex')).toBe(SEED_HEX);
    expect(resolve(Buffer.from(privateKey))?.address).toBe(ADDRESS);
  });

  it.each([
    ['an address', ADDRESS],
    ['a wrong checksum', `${SECRET_KEY.slice(0, -1)}${SECRET_KEY.endsWith('a') ? 'b' : 'a'}`],
    ['a 31-byte sk_', `sk_${encode(Buffer.alloc(31, 7), Encoding.Name).slice(3)}`],
    ['an upper case prefix', `SK_${SECRET_KEY.slice(3)}`],
    ['a bare prefix', 'sk_'],
    ['trailing junk', `${SEED_HEX}zz`],
    ['a space inside', `${SEED_HEX.slice(0, 32)} ${SEED_HEX.slice(32)}`],
    ['a 0x prefix', `0x${SEED_HEX}`],
    ['odd length', SEED_HEX.slice(1)],
    ['31 bytes', SEED_HEX.slice(2)],
    ['33 bytes', `${SEED_HEX}00`],
    ['48 bytes', LEGACY_HEX.slice(0, 96)],
    ['65 bytes', `${LEGACY_HEX}00`],
    ['a mismatched public key', `${SEED_HEX}${'00'.repeat(32)}`],
    ['nothing', ''],
    ['whitespace', '  \n'],
  ])('rejects %s', (_, input) => {
    expect(() => adapter.parsePrivateKey(input)).toThrow();
  });

  it('shows the key in hex by default and as sk_', () => {
    const { secretKey } = resolve(Buffer.from(SEED_HEX, 'hex'))!;

    expect(adapter.getPrivateKeyFormats()).toEqual(['hex', 'sk']);
    expect(adapter.formatPrivateKey(secretKey)).toBe(SEED_HEX);
    expect(adapter.formatPrivateKey(secretKey, 'hex')).toBe(SEED_HEX);
    expect(adapter.formatPrivateKey(secretKey, 'sk')).toBe(SECRET_KEY);
    expect(new MemoryAccount(SECRET_KEY as `sk_${string}`).address).toBe(ADDRESS);
  });

  it.each([
    ['seed', SEED_HEX],
    ['legacy', LEGACY_HEX],
  ])('restores a stored %s key', (_, hex) => {
    const stored = JSON.parse(JSON.stringify({ privateKey: Buffer.from(hex, 'hex') }));

    expect(resolve(stored.privateKey)?.address).toBe(ADDRESS);
  });
});
