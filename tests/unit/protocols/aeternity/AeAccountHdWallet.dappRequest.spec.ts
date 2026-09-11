import { ref } from 'vue';
import {
  AccountMemory,
  DelegationTag,
  Encoded,
  Encoding,
  METHODS,
  RpcRejectedByUserError,
  Tag,
  decode,
  encode,
  packDelegation,
} from '@aeternity/aepp-sdk';

import { useAccounts } from '@/composables/accounts';
import { usePermissions } from '@/composables/permissions';
import { useDeepLinkApi } from '@/composables/deepLinkApi';
import { useAeSdk } from '@/composables';
import { IN_FRAME, IS_OFFSCREEN_TAB, PROTOCOLS } from '@/constants';

/**
 * In the in-app browser the wallet is the *parent* of the dapp iframe: it is
 * neither the offscreen tab nor running inside a frame, and no deep link is
 * involved. The only thing that tells a dapp's request apart from the wallet's
 * own signing is the `aeppOrigin` the SDK's RPC layer attaches to it. Every
 * such request must be confirmed by the user; the wallet's own flows (which
 * never carry an origin) must keep signing without an extra prompt.
 *
 * Unlike the signer spec, this one deliberately leaves the environment flags
 * at their real (falsy) values so nothing but `aeppOrigin` can open the gate.
 */

const DAPP_ORIGIN = 'https://dapp.example';

const memActive = AccountMemory.generate();
const ADDRESS_ACTIVE = memActive.address;
const ADDRESS_RECIPIENT = AccountMemory.generate().address;

const accountActive = {
  protocol: PROTOCOLS.aeternity,
  address: ADDRESS_ACTIVE,
  idx: 0,
  globalIdx: 0,
  type: 'hd-wallet',
  secretKey: decode(memActive.secretKey),
};

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
let checkOrAskPermission: ReturnType<typeof vi.fn>;
let superSignTransaction: any;

const buildSpendTx = () => sdk.buildTx({
  tag: Tag.SpendTx,
  senderId: ADDRESS_ACTIVE,
  recipientId: ADDRESS_RECIPIENT,
  amount: 1e18,
  fee: 20000000000000,
  nonce: 1,
  payload: 'ba_Xfbg4g==',
} as any) as Encoded.Transaction;

const delegation = packDelegation({
  tag: DelegationTag.AensPreclaim,
  accountAddress: ADDRESS_ACTIVE as Encoded.AccountAddress,
  contractAddress: encode(new Uint8Array(32), Encoding.ContractAddress),
});

const wallet = () => new AeAccountHdWallet(ref('ae_uat'));

function mockPermission(granted: boolean) {
  checkOrAskPermission = vi.fn(async () => granted);
  // @ts-ignore
  (usePermissions as vi.Mock).mockReturnValue({ checkOrAskPermission });
}

beforeEach(async () => {
  vi.clearAllMocks();

  mockPermission(true);
  // @ts-ignore
  (useDeepLinkApi as vi.Mock).mockReturnValue({ isDeepLinkUsed: false });
  // @ts-ignore
  (useAccounts as vi.Mock).mockReturnValue({
    aeAccounts: ref([accountActive]),
    getLastActiveProtocolAccount: vi.fn(() => accountActive),
    getAccountByProtocolAndAddress: vi.fn(
      (protocol: string, addr: string) => (
        (protocol === PROTOCOLS.aeternity && addr === ADDRESS_ACTIVE) ? accountActive : undefined
      ),
    ),
  });
  // @ts-ignore
  (useAeSdk as vi.Mock).mockReturnValue({
    ensureNodeNetworkId: vi.fn(),
    getAeSdk: vi.fn(async () => ({ api: {} })),
  });

  // `AeAccountHdWallet` is pulled in by `registerAdapters` (a setup file)
  // before these mocks exist, so it is re-imported here. The SDK is re-imported
  // alongside it so the spy lands on the class the fresh module extends.
  vi.resetModules();
  sdk = await import('@aeternity/aepp-sdk');
  ({ AeAccountHdWallet } = await import('@/protocols/aeternity/libs/AeAccountHdWallet'));

  superSignTransaction = vi
    .spyOn(sdk.MemoryAccount.prototype, 'signTransaction')
    .mockResolvedValue('tx_signed' as Encoded.Transaction);
});

afterEach(() => superSignTransaction.mockRestore());

it('runs with the in-app browser environment: not offscreen, not framed', () => {
  expect(IS_OFFSCREEN_TAB).toBe(false);
  expect(IN_FRAME).toBe(false);
});

describe('signTransaction', () => {
  it('asks the user to confirm a request that came from a dapp', async () => {
    await wallet().signTransaction(buildSpendTx(), { aeppOrigin: DAPP_ORIGIN } as any);

    expect(checkOrAskPermission).toHaveBeenCalledTimes(1);
    expect(checkOrAskPermission.mock.calls[0][0]).toBe(METHODS.sign);
    expect(checkOrAskPermission.mock.calls[0][1]).toBe(DAPP_ORIGIN);
    expect(superSignTransaction).toHaveBeenCalledTimes(1);
  });

  it('does not sign a dapp request the user rejected', async () => {
    mockPermission(false);

    await expect(
      wallet().signTransaction(buildSpendTx(), { aeppOrigin: DAPP_ORIGIN } as any),
    ).rejects.toBeInstanceOf(RpcRejectedByUserError);
    expect(superSignTransaction).not.toHaveBeenCalled();
  });

  it("signs the wallet's own transaction without an extra prompt", async () => {
    await wallet().signTransaction(buildSpendTx(), {} as any);

    expect(checkOrAskPermission).not.toHaveBeenCalled();
    expect(superSignTransaction).toHaveBeenCalledTimes(1);
  });
});

describe('signMessage', () => {
  it('asks the user to confirm a request that came from a dapp', async () => {
    await wallet().signMessage('hello', { aeppOrigin: DAPP_ORIGIN } as any);

    expect(checkOrAskPermission).toHaveBeenCalledTimes(1);
    expect(checkOrAskPermission.mock.calls[0][0]).toBe(METHODS.signMessage);
    expect(checkOrAskPermission.mock.calls[0][1]).toBe(DAPP_ORIGIN);
  });

  it('does not sign a dapp request the user rejected', async () => {
    mockPermission(false);

    await expect(
      wallet().signMessage('hello', { aeppOrigin: DAPP_ORIGIN } as any),
    ).rejects.toBeInstanceOf(RpcRejectedByUserError);
  });

  it("signs the wallet's own message without an extra prompt", async () => {
    await wallet().signMessage('hello', {} as any);

    expect(checkOrAskPermission).not.toHaveBeenCalled();
  });
});

describe('signDelegation', () => {
  it('asks the user to confirm a request that came from a dapp', async () => {
    await wallet().signDelegation(delegation, { aeppOrigin: DAPP_ORIGIN } as any);

    expect(checkOrAskPermission).toHaveBeenCalledTimes(1);
    expect(checkOrAskPermission.mock.calls[0][0]).toBe(METHODS.signDelegation);
    expect(checkOrAskPermission.mock.calls[0][1]).toBe(DAPP_ORIGIN);
  });

  it('does not sign a dapp request the user rejected', async () => {
    mockPermission(false);

    await expect(
      wallet().signDelegation(delegation, { aeppOrigin: DAPP_ORIGIN } as any),
    ).rejects.toBeInstanceOf(RpcRejectedByUserError);
  });

  it("signs the wallet's own delegation without an extra prompt", async () => {
    await wallet().signDelegation(delegation, {});

    expect(checkOrAskPermission).not.toHaveBeenCalled();
  });
});

describe('unsafeSign', () => {
  const data = new Uint8Array([1, 2, 3]);

  it('asks the user to confirm a request that came from a dapp', async () => {
    await wallet().unsafeSign(data, { aeppOrigin: DAPP_ORIGIN });

    expect(checkOrAskPermission).toHaveBeenCalledTimes(1);
    expect(checkOrAskPermission.mock.calls[0][0]).toBe(METHODS.unsafeSign);
    expect(checkOrAskPermission.mock.calls[0][1]).toBe(DAPP_ORIGIN);
  });

  it('does not sign a dapp request the user rejected', async () => {
    mockPermission(false);

    await expect(
      wallet().unsafeSign(data, { aeppOrigin: DAPP_ORIGIN }),
    ).rejects.toBeInstanceOf(RpcRejectedByUserError);
  });

  it('does not ask again once the enclosing request was already confirmed', async () => {
    const account = wallet();
    account.isSigningAlreadyConfirmed = true;

    await account.unsafeSign(data, { aeppOrigin: DAPP_ORIGIN });

    expect(checkOrAskPermission).not.toHaveBeenCalled();
  });

  it("signs the wallet's own data without an extra prompt", async () => {
    await wallet().unsafeSign(data, {});

    expect(checkOrAskPermission).not.toHaveBeenCalled();
  });
});
