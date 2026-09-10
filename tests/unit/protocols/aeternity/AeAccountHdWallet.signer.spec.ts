import { ref } from 'vue';
import {
  AccountMemory,
  DelegationTag,
  Encoded,
  Encoding,
  Tag,
  decode,
  encode,
  packDelegation,
} from '@aeternity/aepp-sdk';

import { useAccounts } from '@/composables/accounts';
import { usePermissions } from '@/composables/permissions';
import { useDeepLinkApi } from '@/composables/deepLinkApi';
import { useAeSdk } from '@/composables';
import {
  ACCOUNT_TYPES,
  AIRGAP_SIGNED_TRANSACTION_MESSAGE_TYPE,
  PROTOCOLS,
} from '@/constants';

// The Air Gap device signs in the confirmation popup and sends the signature
// back to the offscreen tab over a runtime message.
vi.mock('@/constants', async (importOriginal) => ({
  ...await importOriginal<any>(),
  IS_OFFSCREEN_TAB: true,
}));

/**
 * The confirmation modal is where the user picks the signing account. It
 * reports that choice back over the same round trip `checkOrAskPermission`
 * already awaits - not by mutating shared "active account" state, which is
 * not guaranteed to have propagated to this context (e.g. a real popup window
 * vs. the offscreen tab) by the time signing resumes. Signing has to honour
 * that choice: re-point the transaction at it and sign with its key - but
 * only when a modal actually ran. A standing permission that
 * `checkOrAskPermission` auto-grants with no UI shown must not silently
 * override `fromAccount`.
 *
 * `AeAccountHdWallet` is pulled in by `registerAdapters` (a setup file) before
 * these mocks exist, so the module registry is reset and it is re-imported here.
 * The SDK is re-imported alongside it, so the spy lands on the very class the
 * fresh module extends.
 */

/** The wallet holds the key of every account it did not import from a device. */
const memPrepared = AccountMemory.generate();
const memChosen = AccountMemory.generate();
const ADDRESS_PREPARED = memPrepared.address;
const ADDRESS_CHOSEN = memChosen.address;
const ADDRESS_RECIPIENT = AccountMemory.generate().address;

const accountPrepared = {
  protocol: PROTOCOLS.aeternity,
  address: ADDRESS_PREPARED,
  idx: 0,
  globalIdx: 0,
  type: 'hd-wallet',
  secretKey: decode(memPrepared.secretKey),
};
const accountChosen = {
  protocol: PROTOCOLS.aeternity,
  address: ADDRESS_CHOSEN,
  idx: 1,
  globalIdx: 1,
  type: 'hd-wallet',
  secretKey: decode(memChosen.secretKey),
};
const ADDRESS_AIR_GAP = AccountMemory.generate().address;
const accountAirGap = {
  protocol: PROTOCOLS.aeternity,
  address: ADDRESS_AIR_GAP,
  idx: 2,
  globalIdx: 2,
  type: ACCOUNT_TYPES.airGap,
};
const ADDRESS_LEDGER = AccountMemory.generate().address;
const accountLedger = {
  protocol: PROTOCOLS.aeternity,
  address: ADDRESS_LEDGER,
  idx: 3,
  globalIdx: 3,
  type: ACCOUNT_TYPES.ledger,
};
const walletAccounts = [accountPrepared, accountChosen, accountAirGap, accountLedger];
/** No device-backed account, so no Air Gap signature can ever arrive. */
const walletAccountsNoDevices = [accountPrepared, accountChosen];

const onMessage = () => (globalThis as any).browser.runtime.onMessage;
/** The handler registered to wait for the Air Gap device's signature. */
const registeredHandler = () => onMessage().addListener.mock.calls[0]?.[0];

const NEXT_NONCE = 42;
const getAccountNextNonce = vi.fn(async () => ({ nextNonce: NEXT_NONCE }));

vi.mock('@/composables/accounts', () => ({ useAccounts: vi.fn() }));
vi.mock('@/composables/permissions', () => ({ usePermissions: vi.fn() }));
vi.mock('@/composables/deepLinkApi', () => ({ useDeepLinkApi: vi.fn() }));
vi.mock('@/composables/modals', () => ({ useModals: vi.fn(() => ({ openModal: vi.fn() })) }));
vi.mock('@/composables', () => ({
  useAeSdk: vi.fn(),
  useLedger: vi.fn(() => ({ signTransaction: vi.fn(), signMessage: vi.fn() })),
}));
vi.mock('@/protocols/aeternity/composables', () => ({
  useAeMiddleware: vi.fn(() => ({ getMiddleware: vi.fn() })),
}));

let sdk: typeof import('@aeternity/aepp-sdk');
let AeAccountHdWallet: typeof import('@/protocols/aeternity/libs/AeAccountHdWallet').AeAccountHdWallet;
let superSignTransaction: any;

const buildSpendTxFor = (senderId: string) => sdk.buildTx({
  tag: Tag.SpendTx,
  senderId,
  recipientId: ADDRESS_RECIPIENT,
  amount: 1e18,
  fee: 20000000000000,
  nonce: 1,
  payload: 'ba_Xfbg4g==',
} as any) as Encoded.Transaction;

/**
 * `getLastActiveProtocolAccount` / `getAccountByProtocolAndAddress`. This is
 * deliberately independent of the modal's choice below - the two must not be
 * conflated, which is exactly the bug being guarded against here.
 */
function setWalletAccounts(activeAddress: string, accounts = walletAccounts) {
  // @ts-ignore
  (useAccounts as vi.Mock).mockReturnValue({
    aeAccounts: ref(accounts),
    getLastActiveProtocolAccount: vi.fn(
      () => accounts.find((acc) => acc.address === activeAddress),
    ),
    getAccountByProtocolAndAddress: vi.fn(
      (protocol: string, addr: string) => accounts.find(
        (acc) => acc.protocol === protocol && acc.address === addr,
      ),
    ),
  });
}

/** The confirmation modal ran and the user picked `selectedAddress` there. */
function mockModalRanAndChose(selectedAddress: string, rebuildForSelectedAccount = false) {
  // @ts-ignore
  (usePermissions as vi.Mock).mockReturnValue({
    checkOrAskPermission: vi.fn(
      async (_method: any, _url: any, _props: any, onModalResolved: any) => {
        onModalResolved?.({ selectedAddress, rebuildForSelectedAccount });
        return true;
      },
    ),
  });
}

/** A standing permission auto-granted the request; no modal ran, nothing was chosen. */
function mockPermissionAutoGranted() {
  // @ts-ignore
  (usePermissions as vi.Mock).mockReturnValue({
    checkOrAskPermission: vi.fn(async () => true),
  });
}

const signTx = (txBase64: Encoded.Transaction, options: any = {}) => (
  new AeAccountHdWallet(ref('ae_uat')).signTransaction(txBase64, options)
);

beforeEach(async () => {
  vi.clearAllMocks();

  mockPermissionAutoGranted();
  // Pretend we arrived over a deep link, so permission is checked at all.
  // @ts-ignore
  (useDeepLinkApi as vi.Mock).mockReturnValue({ isDeepLinkUsed: true });
  // @ts-ignore
  (useAeSdk as vi.Mock).mockReturnValue({
    ensureNodeNetworkId: vi.fn(),
    getAeSdk: vi.fn(async () => ({ api: { getAccountNextNonce } })),
  });

  vi.resetModules();
  sdk = await import('@aeternity/aepp-sdk');
  ({ AeAccountHdWallet } = await import('@/protocols/aeternity/libs/AeAccountHdWallet'));

  // Must come after the re-import: `initPolyfills` runs as part of that module
  // graph and reassigns `window.browser` to a non-extension stub carrying only
  // `getURL`/`storage`, so the messaging API the real extension injects has to
  // be stood back up here.
  (globalThis as any).browser.runtime.onMessage = {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  };

  superSignTransaction = vi
    .spyOn(sdk.MemoryAccount.prototype, 'signTransaction')
    .mockResolvedValue('tx_signed' as Encoded.Transaction);
});

afterEach(() => superSignTransaction.mockRestore());

describe('AeAccountHdWallet.signTransaction', () => {
  it('signs the transaction untouched when the user confirms with the prepared account', async () => {
    setWalletAccounts(ADDRESS_PREPARED);
    mockModalRanAndChose(ADDRESS_PREPARED);
    const txBase64 = buildSpendTxFor(ADDRESS_PREPARED);

    await signTx(txBase64);

    const [signedTx] = superSignTransaction.mock.calls[0];
    expect(signedTx).toBe(txBase64);
  });

  it('rebuilds for the account the user chose and opted to rebuild for', async () => {
    setWalletAccounts(ADDRESS_PREPARED);
    mockModalRanAndChose(ADDRESS_CHOSEN, true);
    const txBase64 = buildSpendTxFor(ADDRESS_PREPARED);

    await signTx(txBase64);

    const [signedTx, opts] = superSignTransaction.mock.calls[0];
    expect(sdk.getTransactionSignerAddress(signedTx)).toBe(ADDRESS_CHOSEN);
    expect((sdk.unpackTx(signedTx) as any).nonce).toBe(NEXT_NONCE);
    // The signing key is resolved from `fromAccount`, so it must name that account.
    expect(opts.fromAccount).toBe(ADDRESS_CHOSEN);
  });

  it('does not rebuild when the user picked another account without opting into the rebuild', async () => {
    setWalletAccounts(ADDRESS_PREPARED);
    mockModalRanAndChose(ADDRESS_CHOSEN, false);
    const txBase64 = buildSpendTxFor(ADDRESS_PREPARED);

    await signTx(txBase64);

    const [signedTx, opts] = superSignTransaction.mock.calls[0];
    // Unrebuilt: still names the originally prepared sender, so the node will
    // reject a signature from `ADDRESS_CHOSEN` - which is the point, since the
    // user never opted in to changing that.
    expect(sdk.getTransactionSignerAddress(signedTx)).toBe(ADDRESS_PREPARED);
    expect(opts.fromAccount).toBe(ADDRESS_CHOSEN);
  });

  it('lets the modal choice win over a fromAccount the caller asked for', async () => {
    setWalletAccounts(ADDRESS_PREPARED);
    mockModalRanAndChose(ADDRESS_CHOSEN, true);
    const txBase64 = buildSpendTxFor(ADDRESS_PREPARED);

    await signTx(txBase64, { fromAccount: ADDRESS_PREPARED });

    const [signedTx, opts] = superSignTransaction.mock.calls[0];
    expect(sdk.getTransactionSignerAddress(signedTx)).toBe(ADDRESS_CHOSEN);
    expect(opts.fromAccount).toBe(ADDRESS_CHOSEN);
  });

  it('honours fromAccount, not the merely-active account, when no modal was shown', async () => {
    // A standing permission auto-grants with no UI at all. The active account
    // may differ from `fromAccount` for reasons unrelated to this particular
    // request; nothing was chosen for this signing, so `fromAccount` must win
    // and the transaction must be left untouched.
    setWalletAccounts(ADDRESS_CHOSEN);
    mockPermissionAutoGranted();
    const txBase64 = buildSpendTxFor(ADDRESS_PREPARED);

    await signTx(txBase64, { fromAccount: ADDRESS_PREPARED });

    const [signedTx, opts] = superSignTransaction.mock.calls[0];
    expect(signedTx).toBe(txBase64);
    expect(opts.fromAccount).toBe(ADDRESS_PREPARED);
  });
});

/**
 * Waiting for an Air Gap device's signature means registering a runtime message
 * listener before the confirmation popup opens - i.e. before it is known whether
 * the signature will ever come. Every path out of signing has to dispose of it,
 * or each such attempt strands a handler that nothing will ever remove.
 */
describe('AeAccountHdWallet.signTransaction Air Gap message listener', () => {
  beforeEach(() => setWalletAccounts(ADDRESS_AIR_GAP));

  it('waits for the signature when the user does sign with the Air Gap account', async () => {
    mockModalRanAndChose(ADDRESS_AIR_GAP);

    const pending = signTx(buildSpendTxFor(ADDRESS_PREPARED), { fromAccount: ADDRESS_AIR_GAP });
    // Stand in for the confirmation popup sending the signed transaction back.
    registeredHandler()({
      type: AIRGAP_SIGNED_TRANSACTION_MESSAGE_TYPE,
      payload: 'tx_signedByTheAirGapDevice',
    });

    await expect(pending).resolves.toBe('tx_signedByTheAirGapDevice');
    // Signing must not fall through to the in-memory key for an Air Gap account.
    expect(superSignTransaction).not.toHaveBeenCalled();
    expect(onMessage().removeListener).toHaveBeenCalledWith(registeredHandler());
  });

  it('removes the listener when the user picks a non-Air Gap account instead', async () => {
    // Nothing will ever send that message now, so the handler would sit there
    // for the lifetime of the offscreen tab.
    mockModalRanAndChose(ADDRESS_CHOSEN);

    await signTx(buildSpendTxFor(ADDRESS_PREPARED), { fromAccount: ADDRESS_AIR_GAP });

    expect(superSignTransaction).toHaveBeenCalled();
    expect(onMessage().addListener).toHaveBeenCalledTimes(1);
    expect(onMessage().removeListener).toHaveBeenCalledWith(registeredHandler());
  });

  it('removes the listener when the user rejects the transaction', async () => {
    // @ts-ignore
    (usePermissions as vi.Mock).mockReturnValue({
      checkOrAskPermission: vi.fn(async () => false),
    });

    await expect(
      signTx(buildSpendTxFor(ADDRESS_PREPARED), { fromAccount: ADDRESS_AIR_GAP }),
    ).rejects.toThrow();

    expect(onMessage().removeListener).toHaveBeenCalledWith(registeredHandler());
  });

  /**
   * Which account signs is the user's to pick in the confirmation modal, so a
   * request that arrived for a regular account can still end up being signed by
   * a device. The listener is registered before the modal opens - i.e. before
   * that is knowable - so keying it off the request's account would drop the
   * signature of an account switched to there, stranding the user with a device
   * that scanned, signed and displayed a QR code for nothing.
   */
  it('waits for the signature when the user switches to an Air Gap account', async () => {
    setWalletAccounts(ADDRESS_PREPARED);
    mockModalRanAndChose(ADDRESS_AIR_GAP, true);

    const pending = signTx(buildSpendTxFor(ADDRESS_PREPARED), { fromAccount: ADDRESS_PREPARED });
    registeredHandler()({
      type: AIRGAP_SIGNED_TRANSACTION_MESSAGE_TYPE,
      payload: 'tx_signedByTheAirGapDevice',
    });

    await expect(pending).resolves.toBe('tx_signedByTheAirGapDevice');
    expect(superSignTransaction).not.toHaveBeenCalled();
    // The modal rebuilds for the device itself, so re-pointing the transaction
    // here would only throw away a nonce request - or fail the signing outright
    // over a transaction the device has already signed.
    expect(getAccountNextNonce).not.toHaveBeenCalled();
  });

  it('registers no listener when the wallet holds no Air Gap account', async () => {
    setWalletAccounts(ADDRESS_PREPARED, walletAccountsNoDevices);
    mockModalRanAndChose(ADDRESS_PREPARED);

    await signTx(buildSpendTxFor(ADDRESS_PREPARED));

    expect(onMessage().addListener).not.toHaveBeenCalled();
  });
});

/**
 * `MemoryAccount.signDelegation` builds the payload and hands it to
 * `unsafeSign` without forwarding any of its options, so - unlike every other
 * signing method here - the signing key cannot be named in them. Left to
 * resolve one of its own, `unsafeSign` reads the active account, which in the
 * offscreen tab is not guaranteed to have caught up with the switch the user
 * just made in a popup window.
 */
describe('AeAccountHdWallet.signDelegation', () => {
  const delegation = packDelegation({
    tag: DelegationTag.AensPreclaim,
    accountAddress: ADDRESS_PREPARED as Encoded.AccountAddress,
    contractAddress: encode(new Uint8Array(32), Encoding.ContractAddress),
  });

  const signDelegation = (options: any = {}) => (
    new AeAccountHdWallet(ref('ae_uat')).signDelegation(delegation, options)
  );

  /** The signature that account alone can produce for `delegation` on `ae_uat`. */
  const signatureOf = (mem: AccountMemory) => (
    new sdk.MemoryAccount(mem.secretKey).signDelegation(delegation, { networkId: 'ae_uat' })
  );

  it('signs with the account the user picked in the modal', async () => {
    setWalletAccounts(ADDRESS_PREPARED);
    mockModalRanAndChose(ADDRESS_CHOSEN);

    await expect(signDelegation()).resolves.toBe(await signatureOf(memChosen));
  });

  it('signs with the active account when the user does not switch', async () => {
    setWalletAccounts(ADDRESS_PREPARED);
    mockModalRanAndChose(ADDRESS_PREPARED);

    await expect(signDelegation()).resolves.toBe(await signatureOf(memPrepared));
  });

  it('signs with the active account when no modal was shown', async () => {
    setWalletAccounts(ADDRESS_PREPARED);
    mockPermissionAutoGranted();

    await expect(signDelegation()).resolves.toBe(await signatureOf(memPrepared));
  });

  /**
   * A device-backed account has no key here to sign with. Refusing is the point:
   * the alternative is quietly signing with whichever key is at hand, which is
   * not the account the user picked.
   */
  it('refuses to sign for an Air Gap account', async () => {
    setWalletAccounts(ADDRESS_PREPARED);
    mockModalRanAndChose(ADDRESS_AIR_GAP);

    await expect(signDelegation()).rejects.toThrow('AirGap sign not implemented yet');
  });

  it('refuses to sign for a Ledger account', async () => {
    setWalletAccounts(ADDRESS_PREPARED);
    mockModalRanAndChose(ADDRESS_LEDGER);

    await expect(signDelegation()).rejects.toThrow('Unsupported protocol');
  });
});
