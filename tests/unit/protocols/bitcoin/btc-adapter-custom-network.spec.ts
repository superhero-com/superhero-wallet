import { mnemonicToSeedSync } from '@scure/bip39';
import {
  Transaction,
  payments,
  networks as bitcoinNetworks,
  address as bitcoinAddress,
} from 'bitcoinjs-lib';

import type { INetwork } from '@/types';
import { BitcoinAdapter } from '@/protocols/bitcoin/libs/BitcoinAdapter';
import { useNetworks } from '@/composables/networks';
import {
  NETWORK_NAME_MAINNET,
  NETWORK_NAME_TESTNET,
  NETWORK_TYPE_CUSTOM,
} from '@/constants';

const MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const CUSTOM_NODE_URL = 'http://custom-btc-node';

function buildFundingTxHex(address: string, valueSats: number) {
  const tx = new Transaction();
  tx.version = 2;
  tx.addInput(Buffer.alloc(32, 1), 0);
  (tx.ins[0] as any).witness = [Buffer.alloc(1)];
  const { output } = payments.p2wpkh({ address, network: bitcoinNetworks.testnet });
  tx.addOutput(output!, BigInt(valueSats));
  return tx.toHex();
}

describe('BitcoinAdapter - custom network uses the testnet address format everywhere', () => {
  const {
    activeNetwork,
    addCustomNetwork,
    switchNetwork,
    resetNetworks,
  } = useNetworks();
  const adapter = new BitcoinAdapter();
  const seed = mnemonicToSeedSync(MNEMONIC);
  const pubkey = Buffer.from('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', 'hex');
  const tb1qRecipient = payments.p2wpkh({ pubkey, network: bitcoinNetworks.testnet }).address!;
  const bc1qRecipient = payments.p2wpkh({ pubkey, network: bitcoinNetworks.bitcoin }).address!;

  let testnetAccountAddress: string;

  beforeAll(() => {
    switchNetwork(NETWORK_NAME_TESTNET);
    testnetAccountAddress = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0).address;
    switchNetwork(NETWORK_NAME_MAINNET);
    const customNetwork: INetwork = {
      name: 'Custom BTC',
      type: NETWORK_TYPE_CUSTOM,
      protocols: {
        ...activeNetwork.value.protocols,
        bitcoin: { ...activeNetwork.value.protocols.bitcoin, nodeUrl: CUSTOM_NODE_URL },
      },
    };
    addCustomNetwork(customNetwork);
    switchNetwork(customNetwork.name);
  });

  afterAll(() => {
    resetNetworks();
  });

  it('derives the same tb1q account as testnet (coin type 1)', () => {
    const account = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0);
    expect(account.address).toBe(testnetAccountAddress);
    expect(account.address.startsWith('tb1q')).toBe(true);
    expect(adapter.getAccountPrefix()).toBe('tb1q');
  });

  it('accepts tb1q and rejects bc1q recipients', () => {
    expect(adapter.isAccountAddressValid(tb1qRecipient, NETWORK_TYPE_CUSTOM)).toBe(true);
    expect(adapter.isAccountAddressValid(bc1qRecipient, NETWORK_TYPE_CUSTOM)).toBe(false);
  });

  it('signs a send to a tb1q recipient with change back to the tb1q sender', async () => {
    const account = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0);
    const txid = 'ab'.repeat(32);
    const fundingHex = buildFundingTxHex(account.address, 20_000);
    // @ts-ignore - test double for the fetch boundary
    global.fetch = vi.fn((url: any) => {
      const u = String(url);
      if (u === `${CUSTOM_NODE_URL}/address/${account.address}/utxo`) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ txid, vout: 0, value: 20_000 }]),
        });
      }
      if (u === `${CUSTOM_NODE_URL}/tx/${txid}/hex`) {
        return Promise.resolve({ text: () => Promise.resolve(fundingHex) });
      }
      return Promise.reject(new Error(`Unhandled fetch: ${u}`));
    });

    const tx = await adapter.constructAndSignTx(0.0001, tb1qRecipient, {
      address: account.address,
      fee: 0.00001,
      publicKey: Buffer.from(account.publicKey),
      secretKey: Buffer.from(account.secretKey),
    });
    const decoded = Transaction.fromHex(tx.toHex());
    const outputs = decoded.outs.map((o) => [
      bitcoinAddress.fromOutputScript(o.script, bitcoinNetworks.testnet),
      Number(o.value),
    ]);

    expect(outputs).toEqual([
      [tb1qRecipient, 10_000],
      [account.address, 9_000],
    ]);
  });

  it('sizes a send to a tb1q recipient with change to the tb1q sender', async () => {
    const account = adapter.getHdWalletAccountFromMnemonicSeed(seed, 0);
    // @ts-ignore - test double for the fetch boundary
    global.fetch = vi.fn((url: any) => (String(url) === `${CUSTOM_NODE_URL}/address/${account.address}/utxo`
      ? Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ txid: 'ab'.repeat(32), vout: 0, value: 20_000 }]),
      })
      : Promise.reject(new Error(`Unhandled fetch: ${url}`))));

    // One P2WPKH input, the payment and change
    expect(await adapter.estimateVsize(0.0001, tb1qRecipient, [10], { address: account.address }))
      .toEqual([141]);
  });
});
