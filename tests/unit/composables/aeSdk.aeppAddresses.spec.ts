// @ts-nocheck
/**
 * A real aepp SDK talks to the wallet's real SDK. The wallet holds accounts of several
 * protocols; only its login and the user's answer in the modal are faked.
 */
import { ref } from 'vue';
import { JSDOM } from 'jsdom';
import { mnemonicToSeedSync } from '@scure/bip39';
import {
  AeSdkAepp,
  BrowserWindowMessageConnection,
  MESSAGE_DIRECTION,
  Node,
} from '@aeternity/aepp-sdk';

import { ACCOUNT_TYPES, PROTOCOLS, STORAGE_KEYS } from '@/constants';
import { WalletStorage } from '@/lib/WalletStorage';
import { encrypt, generateEncryptionKey, generateSalt } from '@/utils/crypto';

const MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const DAPP_URL = 'https://dapp.example/';

/** A page whose `postMessage` reports its origin and source as a browser does. */
function createPage() {
  const { window } = new JSDOM('', { url: DAPP_URL });
  window.postMessage = (data) => setTimeout(() => window.dispatchEvent(new window.MessageEvent('message', {
    data,
    origin: window.location.origin,
    source: window,
  })));
  return window;
}

function seedHdAccounts(protocols) {
  WalletStorage.set(
    STORAGE_KEYS.accountsRaw,
    protocols.map((protocol) => ({ isRestored: true, protocol, type: ACCOUNT_TYPES.hdWallet })),
  );
}

/** Returns the key that decrypts the imported account */
async function seedImportedAeAccount() {
  const key = await generateEncryptionKey('test-password', generateSalt());
  WalletStorage.set(STORAGE_KEYS.privateKeyAccountsRaw, await encrypt(key, JSON.stringify([{
    type: ACCOUNT_TYPES.privateKey,
    protocol: PROTOCOLS.aeternity,
    privateKey: Buffer.from('aa'.repeat(32), 'hex'),
  }])));
  return key;
}

describe('useAeSdk, an aepp asking for addresses', () => {
  let openModal;
  let encryptionKey;

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    vi.spyOn(Node.prototype, 'getStatus').mockResolvedValue({ networkId: 'ae_mainnet' });

    openModal = vi.fn().mockResolvedValue(undefined);
    encryptionKey = ref(undefined);
    vi.doMock('@/composables/modals', async (importOriginal) => {
      const actual = await importOriginal();
      return { ...actual, useModals: () => ({ ...actual.useModals(), openModal }) };
    });
    vi.doMock('@/composables/auth', () => ({
      useAuth: () => ({
        mnemonic: ref(MNEMONIC),
        mnemonicSeed: ref(mnemonicToSeedSync(MNEMONIC)),
        isMnemonicRestored: ref(true),
        isAuthenticated: ref(true),
        encryptionKey,
      }),
    }));
  });

  afterEach(() => {
    vi.doUnmock('@/composables/modals');
    vi.doUnmock('@/composables/auth');
    vi.restoreAllMocks();
  });

  async function connectAepp() {
    await import('@/protocols/registerAdapters');
    const { useAccounts } = await import('@/composables/accounts');
    const { useAeSdk } = await import('@/composables/aeSdk');
    const walletSdk = await useAeSdk().getAeSdk();

    const page = createPage();
    walletSdk.addRpcClient(new BrowserWindowMessageConnection({
      self: page,
      target: page,
      sendDirection: MESSAGE_DIRECTION.to_aepp,
      receiveDirection: MESSAGE_DIRECTION.to_waellet,
    }));
    const aepp = new AeSdkAepp({ name: 'Test aepp' });
    await aepp.connectToWallet(new BrowserWindowMessageConnection({
      self: page,
      target: page,
      sendDirection: MESSAGE_DIRECTION.to_waellet,
      receiveDirection: MESSAGE_DIRECTION.to_aepp,
    }));
    return { aepp, accounts: useAccounts() };
  }

  it('get only the æternity addresses of the wallet', async () => {
    seedHdAccounts([
      PROTOCOLS.bitcoin,
      PROTOCOLS.aeternity,
      PROTOCOLS.ethereum,
      PROTOCOLS.aeternity,
      PROTOCOLS.solana,
    ]);
    const { aepp, accounts } = await connectAepp();
    const addresses = await aepp.askAddresses();

    expect(accounts.protocolsInUse.value).toEqual([
      PROTOCOLS.bitcoin, PROTOCOLS.aeternity, PROTOCOLS.ethereum, PROTOCOLS.solana,
    ]);
    expect(addresses).toHaveLength(2);
    expect(addresses).toEqual(accounts.aeAccounts.value.map(({ address }) => address));
    addresses.forEach((address) => expect(address).toMatch(/^ak_/));
    expect(openModal).toHaveBeenCalledOnce();
  });

  it('get the æternity addresses that are still being restored', async () => {
    seedHdAccounts([PROTOCOLS.bitcoin, PROTOCOLS.ethereum]);
    const key = await seedImportedAeAccount();
    const { aepp, accounts } = await connectAepp();
    const asking = aepp.askAddresses();
    await vi.waitFor(() => expect(openModal).toHaveBeenCalled());
    // The imported accounts are readable only once the key arrives
    encryptionKey.value = key;
    const addresses = await asking;

    expect(addresses).toHaveLength(1);
    expect(addresses).toEqual(accounts.aeAccounts.value.map(({ address }) => address));
    expect(addresses[0]).toMatch(/^ak_/);
  });

  it('get nothing when the user rejects', async () => {
    seedHdAccounts([PROTOCOLS.aeternity, PROTOCOLS.ethereum]);
    openModal.mockRejectedValue(new Error('Rejected'));
    const { aepp } = await connectAepp();

    await expect(aepp.askAddresses()).rejects.toThrow('Operation rejected by user');
  });
});
