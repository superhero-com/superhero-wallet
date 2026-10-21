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
  METHODS,
  Node,
  RpcNotAuthorizeError,
  SUBSCRIPTION_TYPES,
  Tag,
  buildTx,
  unpackTx,
} from '@aeternity/aepp-sdk';

import {
  ACCOUNT_TYPES,
  MODAL_CONFIRM_TRANSACTION_SIGN,
  PERMISSION_DEFAULTS,
  PROTOCOLS,
  STORAGE_KEYS,
} from '@/constants';
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
        isMnemonicUnreadable: ref(false),
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

  describe('then asking to sign', () => {
    /** As an account of the SDK's `WalletConnectorFrame.getAccounts()` asks */
    async function requestSign(
      aepp,
      accounts,
      address = accounts.getLastActiveProtocolAccount(PROTOCOLS.aeternity).address,
    ) {
      const tx = buildTx({
        tag: Tag.SpendTx,
        senderId: address,
        recipientId: address,
        amount: '1000000000000000000',
        fee: 2e14,
        nonce: 1,
      });
      const { signedTransaction } = await aepp.rpcClient.request(METHODS.sign, {
        onAccount: address, tx, returnSigned: true, networkId: 'ae_mainnet',
      });
      return unpackTx(signedTransaction);
    }

    it('is rejected without asking when the aepp was given no account', async () => {
      seedHdAccounts([PROTOCOLS.aeternity]);
      const { aepp, accounts } = await connectAepp();

      await expect(requestSign(aepp, accounts)).rejects.toBeInstanceOf(RpcNotAuthorizeError);
      expect(openModal).not.toHaveBeenCalled();
    });

    it('is rejected without asking when the user refused the aepp the accounts', async () => {
      seedHdAccounts([PROTOCOLS.aeternity]);
      openModal.mockRejectedValueOnce(new Error('Rejected'));
      const { aepp, accounts } = await connectAepp();
      await expect(aepp.askAddresses()).rejects.toThrow('Operation rejected by user');

      await expect(requestSign(aepp, accounts)).rejects.toBeInstanceOf(RpcNotAuthorizeError);
      expect(openModal).toHaveBeenCalledOnce();
    });

    it('is asked to the user once the aepp listed the accounts', async () => {
      seedHdAccounts([PROTOCOLS.aeternity]);
      const { aepp, accounts } = await connectAepp();
      await aepp.askAddresses();

      expect(await requestSign(aepp, accounts)).toMatchObject({ tag: Tag.SignedTx });
      expect(openModal).toHaveBeenCalledTimes(2);
      expect(openModal).toHaveBeenLastCalledWith(MODAL_CONFIRM_TRANSACTION_SIGN, expect.anything());
    });

    describe('under the daily limit of a subscribed aepp', () => {
      async function connectAeppWithLimit() {
        WalletStorage.set(STORAGE_KEYS.permissions, {
          'dapp.example': {
            ...PERMISSION_DEFAULTS,
            host: 'dapp.example',
            name: 'Dapp',
            address: true,
            dailySpendLimit: true,
            transactionSignLimit: 5,
            protocol: 'https:',
          },
        });
        const connected = await connectAepp();
        await connected.aepp.subscribeAddress(SUBSCRIPTION_TYPES.subscribe, 'connected');
        return connected;
      }

      async function getSpent() {
        const { usePermissions } = await import('@/composables/permissions');
        return usePermissions().permissions.value['dapp.example'].transactionSignSpent;
      }

      it('is signed without asking, and counted', async () => {
        seedHdAccounts([PROTOCOLS.aeternity]);
        const { aepp, accounts } = await connectAeppWithLimit();

        expect(await requestSign(aepp, accounts)).toMatchObject({ tag: Tag.SignedTx });
        expect(openModal).not.toHaveBeenCalled();
        // The amount and the fee
        expect(await getSpent()).toBe(1.0002);
      });

      it('is asked to the user when it is from another account, and not counted', async () => {
        seedHdAccounts([PROTOCOLS.aeternity, PROTOCOLS.aeternity]);
        const { aepp, accounts } = await connectAeppWithLimit();
        const active = accounts.getLastActiveProtocolAccount(PROTOCOLS.aeternity);
        const other = accounts.aeAccounts.value.find(({ address }) => address !== active.address);

        await requestSign(aepp, accounts, other.address);

        expect(openModal).toHaveBeenCalledOnce();
        expect(openModal).toHaveBeenCalledWith(MODAL_CONFIRM_TRANSACTION_SIGN, expect.anything());
        expect(await getSpent()).toBe(0);
      });
    });
  });
});
