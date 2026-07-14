import { mnemonicToSeedSync } from '@scure/bip39';

import { AeternityAdapter } from '@/protocols/aeternity/libs/AeternityAdapter';
import { AvalancheAdapter } from '@/protocols/avalanche/libs/AvalancheAdapter';
import { BitcoinAdapter } from '@/protocols/bitcoin/libs/BitcoinAdapter';
import { BnbAdapter } from '@/protocols/bnb/libs/BnbAdapter';
import { DogecoinAdapter } from '@/protocols/dogecoin/libs/DogecoinAdapter';
import { EthereumAdapter } from '@/protocols/ethereum/libs/EthereumAdapter';
import { PolygonAdapter } from '@/protocols/polygonPos/libs/PolygonPosAdapter';
import { SolanaAdapter } from '@/protocols/solana/libs/SolanaAdapter';
import { useNetworks } from '@/composables/networks';
import { ACCOUNT_TYPES, NETWORK_NAME_TESTNET } from '@/constants';
import { TEST_ACCOUNT } from '../../fixtures/account';

const toHex = (bytes: Uint8Array) => Buffer.from(bytes).toString('hex');

/**
 * `vi.mock('@/composables/networks', ...)` is unreliable here: `registerAdapters.ts`
 * runs as a global vitest setupFile and its import graph resolves the REAL module
 * before this spec file's mock is hoisted into effect (see repo memory: "Vitest
 * composable mocks must precede registerAdapters import"). Driving the real
 * composable's own `switchNetwork` avoids the ordering problem entirely and is
 * closer to how the app actually reaches testnet.
 */
useNetworks().switchNetwork(NETWORK_NAME_TESTNET);

/**
 * Golden-vector lock for HD key derivation across all 8 protocol adapters.
 *
 * These exact addresses/keys were captured by running this suite against the
 * CURRENT (pre-optimization) derivation code and the shared test mnemonic in
 * `tests/fixtures/account.js`. They exist so that later changes which sit next
 * to derivation (memoizing it, swapping the secp256k1 backend) cannot silently
 * alter which keys/addresses a seed produces — any drift fails this suite.
 */
describe('HD derivation golden vectors', () => {
  const seed = mnemonicToSeedSync(TEST_ACCOUNT.mnemonic);

  it('AeternityAdapter', () => {
    const adapter = new AeternityAdapter();
    const acc0 = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0);
    const acc1 = adapter.getHdWalletAccountFromMnemonicSeed(seed, 1);

    expect(acc0.address).toBe(TEST_ACCOUNT.addressAeternity);
    expect(acc0.address).not.toBe(acc1.address);
    expect(toHex(acc0.publicKey)).toMatchSnapshot();
    expect(toHex(acc0.secretKey)).toMatchSnapshot();
  });

  it('BitcoinAdapter (testnet)', () => {
    const adapter = new BitcoinAdapter();
    const acc0 = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0);
    const acc1 = adapter.getHdWalletAccountFromMnemonicSeed(seed, 1);

    expect(acc0.address).toBe(TEST_ACCOUNT.addressBitcoinTestnet);
    expect(acc0.address).not.toBe(acc1.address);
    expect(toHex(acc0.publicKey)).toMatchSnapshot();
    expect(toHex(acc0.secretKey)).toMatchSnapshot();
  });

  it('EthereumAdapter', () => {
    const adapter = new EthereumAdapter();
    const acc0 = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0);
    const acc1 = adapter.getHdWalletAccountFromMnemonicSeed(seed, 1);

    expect(acc0.address).toBe(TEST_ACCOUNT.addressEthereum);
    expect(acc0.address).not.toBe(acc1.address);
    expect(toHex(acc0.publicKey)).toMatchSnapshot();
    expect(toHex(acc0.secretKey)).toMatchSnapshot();
  });

  // BNB and Polygon PoS derive with the same m/44'/60'/i'/0/0 path and address
  // scheme (checksummed EVM address) as Ethereum, so their golden values are
  // expected to equal EthereumAdapter's. Avalanche uses its own coin type
  // (m/44'/9000'/i'/0/0) and so is checked against its own snapshot instead.
  it.each([
    ['BnbAdapter', () => new BnbAdapter()],
    ['PolygonAdapter', () => new PolygonAdapter()],
  ] as const)('%s', (_name, makeAdapter) => {
    const adapter = makeAdapter();
    const acc0 = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0);
    const acc1 = adapter.getHdWalletAccountFromMnemonicSeed(seed, 1);

    expect(acc0.address).toBe(TEST_ACCOUNT.addressEthereum);
    expect(acc0.address).not.toBe(acc1.address);
    expect(toHex(acc0.publicKey)).toMatchSnapshot();
    expect(toHex(acc0.secretKey)).toMatchSnapshot();
  });

  it('AvalancheAdapter (own coin type m/44\'/9000\'/i\'/0/0)', () => {
    const adapter = new AvalancheAdapter();
    const acc0 = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0);
    const acc1 = adapter.getHdWalletAccountFromMnemonicSeed(seed, 1);

    expect(acc0.address).not.toBe(acc1.address);
    expect(acc0.address).toMatchSnapshot();
    expect(toHex(acc0.publicKey)).toMatchSnapshot();
    expect(toHex(acc0.secretKey)).toMatchSnapshot();
  });

  it('DogecoinAdapter (testnet)', () => {
    const adapter = new DogecoinAdapter('http://localhost:3000');
    const acc0 = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0);
    const acc1 = adapter.getHdWalletAccountFromMnemonicSeed(seed, 1);

    expect(acc0.address).toBeDefined();
    expect(acc0.address).not.toBe(acc1.address);
    expect(acc0.address).toMatchSnapshot();
    expect(toHex(acc0.publicKey)).toMatchSnapshot();
    expect(toHex(acc0.secretKey)).toMatchSnapshot();
  });

  it('SolanaAdapter', () => {
    const adapter = new SolanaAdapter();
    const acc0 = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0);
    const acc1 = adapter.getHdWalletAccountFromMnemonicSeed(seed, 1);

    expect(acc0.address).toBeDefined();
    expect(acc0.address).not.toBe(acc1.address);
    expect(acc0.address).toMatchSnapshot();
    expect(toHex(acc0.publicKey)).toMatchSnapshot();
    expect(toHex(acc0.secretKey)).toMatchSnapshot();
  });

  it('resolveAccountRaw private-key path stays stable (Bitcoin)', () => {
    const adapter = new BitcoinAdapter();
    const priv = Buffer.from(new Uint8Array(32).fill(9));
    const raw = { type: ACCOUNT_TYPES.privateKey, privateKey: priv } as any;
    const res = adapter.resolveAccountRaw(raw, 0, 0);

    expect(res?.address).toMatchSnapshot();
    expect(res?.publicKey?.length).toBeGreaterThan(0);
    expect(res?.secretKey?.length).toBe(32);
  });

  it('resolveAccountRaw private-key path stays stable (Ethereum)', () => {
    const adapter = new EthereumAdapter();
    const priv = Buffer.from(new Uint8Array(32).fill(9));
    const raw = { type: ACCOUNT_TYPES.privateKey, privateKey: priv } as any;
    const res = adapter.resolveAccountRaw(raw, 0, 0);

    expect(res?.address).toMatchSnapshot();
    expect(res?.publicKey?.length).toBeGreaterThan(0);
    expect(res?.secretKey?.length).toBe(32);
  });
});
