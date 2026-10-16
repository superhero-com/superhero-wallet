// @ts-nocheck
import { ref } from 'vue';
import { Contract } from '@aeternity/aepp-sdk';
import { AE_TIPPING_CONTRACTS_TESTNET } from '@/protocols/aeternity/config';

/**
 * A token tip or retip moves exactly the typed amount, so the tipping contract must be
 * allowed exactly that much. Runs the real composable on testnet, the only network with
 * token tips; fakes the token contract, where the allowance is signed.
 */
const TOKEN = 'ct_46WPtSJH9Mc1rNbRaWo6k2v6Bm8dc1FuCFxS2n6gFo7M27Ucu';
const TIPPING_CONTRACT_ACCOUNT = AE_TIPPING_CONTRACTS_TESTNET.tippingV2.replace('ct_', 'ak_');
const ACCOUNT = { protocol: 'aeternity', address: 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR' };

describe('useFungibleTokens, allowing a token tip', () => {
  let tokenContract;

  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
    tokenContract = {
      allowance: vi.fn(),
      methods: { create_allowance: vi.fn(), change_allowance: vi.fn() },
    };
    vi.spyOn(Contract, 'initialize').mockResolvedValue(tokenContract);
    vi.doMock('@/composables/aeSdk', () => ({
      useAeSdk: () => ({
        getAeSdk: async () => ({ getContext: () => ({}) }),
        isTippingSupported: ref(true),
      }),
    }));
    vi.doMock('@/composables/accounts', () => ({
      useAccounts: () => ({
        accounts: ref([ACCOUNT]),
        protocolsInUse: ref(['aeternity']),
        getLastActiveProtocolAccount: () => ACCOUNT,
      }),
    }));

    const { WalletStorage } = await import('@/lib/WalletStorage');
    const { NETWORK_NAME_TESTNET, STORAGE_KEYS } = await import('@/constants');
    WalletStorage.set(STORAGE_KEYS.activeNetworkName, NETWORK_NAME_TESTNET);
    WalletStorage.set(STORAGE_KEYS.fungibleTokenList, {
      aeternity: {
        [TOKEN]: {
          contractId: TOKEN, decimals: 18, protocol: 'aeternity', name: 'Token', symbol: 'TKN',
        },
      },
    });
  });

  afterEach(() => {
    vi.doUnmock('@/composables/aeSdk');
    vi.doUnmock('@/composables/accounts');
    vi.restoreAllMocks();
  });

  /** Returns the account that may take the tokens and the amount it may take. */
  async function allow(amount) {
    await import('@/protocols/registerAdapters');
    const { useFungibleTokens } = await import('@/composables/fungibleTokens');
    await useFungibleTokens().createOrChangeAllowance(TOKEN, amount);
    const [call] = [
      ...tokenContract.methods.create_allowance.mock.calls,
      ...tokenContract.methods.change_allowance.mock.calls,
    ];
    return { forAccount: call[0], allowed: String(call[1]) };
  }

  it('allows every digit of an 18-decimal amount', async () => {
    tokenContract.allowance.mockResolvedValue({ decodedResult: undefined });

    const { forAccount, allowed } = await allow('1.000000000000000001');

    expect(tokenContract.methods.create_allowance).toHaveBeenCalledOnce();
    expect(forAccount).toBe(TIPPING_CONTRACT_ACCOUNT);
    expect(allowed).toBe('1000000000000000001');
  });

  it('changes an existing allowance to every digit of an 18-decimal amount', async () => {
    tokenContract.allowance.mockResolvedValue({ decodedResult: 5n });

    const { allowed } = await allow('12.345678901234567891');

    expect(tokenContract.methods.change_allowance).toHaveBeenCalledOnce();
    // The change, on top of the 5 allowed before
    expect(allowed).toBe('12345678901234567886');
  });
});
