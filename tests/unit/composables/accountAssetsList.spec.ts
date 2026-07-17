// @ts-nocheck
import { ref } from 'vue';
import { PROTOCOLS } from '@/constants';
import { AE_CONTRACT_ID } from '@/protocols/aeternity/config';

const mockActiveAccount = {
  address: 'ak_owner',
  protocol: PROTOCOLS.aeternity,
};

const mockAvailableTokens = {
  ct_alpha: {
    contractId: 'ct_alpha', protocol: PROTOCOLS.aeternity, name: 'Alpha', symbol: 'ALP',
  },
  ct_beta: {
    contractId: 'ct_beta', protocol: PROTOCOLS.aeternity, name: 'Beta', symbol: 'BET',
  },
  ct_gamma: {
    contractId: 'ct_gamma', protocol: PROTOCOLS.aeternity, name: 'Gamma', symbol: 'GAM',
  },
};

// Only `ct_beta` is actually owned (has a balance entry); `ct_alpha`/`ct_gamma` are
// just part of the available-tokens catalogue.
const mockOwnedBalances = [
  {
    contractId: 'ct_beta', convertedBalance: '42', price: 2, address: mockActiveAccount.address, protocol: PROTOCOLS.aeternity,
  },
];

describe('useAccountAssetsList', () => {
  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();

    // These mocks must be registered *before* `registerAdapters` is imported below:
    // `registerAdapters` transitively loads the real `accounts`/`currencies`/etc.
    // composables (via aeSdk.ts -> accounts.ts -> the `@/composables` barrel), so
    // mocking them afterwards would be too late - the real modules would already
    // be cached and linked against each other for this module generation.
    vi.doMock('@/composables/currencies', () => ({
      useCurrencies: () => ({ marketData: ref({}) }),
    }));
    vi.doMock('@/composables/balances', () => ({
      useBalances: () => ({ balance: ref('100') }),
    }));
    vi.doMock('@/composables/accounts', () => ({
      useAccounts: () => ({ activeAccount: ref(mockActiveAccount) }),
    }));
    vi.doMock('@/composables/multisigAccounts', () => ({
      useMultisigAccounts: () => ({ activeMultisigAccount: ref(null) }),
    }));
    vi.doMock('@/composables/fungibleTokens', () => ({
      useFungibleTokens: () => ({
        getAccountTokenBalances: () => mockOwnedBalances,
        getProtocolAvailableTokens: () => mockAvailableTokens,
      }),
    }));

    await import('@/protocols/registerAdapters');
  });

  it('merges balance data onto owned tokens and leaves unowned tokens as catalogue-only entries', async () => {
    const { useAccountAssetsList } = await import('@/composables/accountAssetsList');
    const { accountAssets } = useAccountAssetsList();

    const alpha = accountAssets.value.find((a) => a.contractId === 'ct_alpha');
    const beta = accountAssets.value.find((a) => a.contractId === 'ct_beta');
    const gamma = accountAssets.value.find((a) => a.contractId === 'ct_gamma');

    expect(alpha.convertedBalance).toBeUndefined();
    expect(beta.convertedBalance).toBe('42');
    expect(gamma.convertedBalance).toBeUndefined();

    // Protocol coin (AE) is always present alongside the token catalogue.
    expect(accountAssets.value.find((a) => a.contractId === AE_CONTRACT_ID)).toBeDefined();
  });

  it('ownedOnly restricts the filtered list to the protocol coin and tokens with a balance entry', async () => {
    const { useAccountAssetsList } = await import('@/composables/accountAssetsList');
    const { accountAssetsFiltered } = useAccountAssetsList({ ownedOnly: true });

    const contractIds = accountAssetsFiltered.value.map((a) => a.contractId);
    expect(contractIds).toContain(AE_CONTRACT_ID);
    expect(contractIds).toContain('ct_beta');
    expect(contractIds).not.toContain('ct_alpha');
    expect(contractIds).not.toContain('ct_gamma');
  });

  it('withBalanceOnly excludes tokens with a zero/missing converted balance', async () => {
    const { useAccountAssetsList } = await import('@/composables/accountAssetsList');
    const { accountAssetsFiltered } = useAccountAssetsList({ withBalanceOnly: true });

    const contractIds = accountAssetsFiltered.value.map((a) => a.contractId);
    expect(contractIds).toContain(AE_CONTRACT_ID);
    expect(contractIds).toContain('ct_beta');
    expect(contractIds).not.toContain('ct_alpha');
    expect(contractIds).not.toContain('ct_gamma');
  });

  it('searchTerm filters by symbol or name, case-insensitively', async () => {
    const { useAccountAssetsList } = await import('@/composables/accountAssetsList');
    const searchTerm = ref('gam');
    const { accountAssetsFiltered } = useAccountAssetsList({ searchTerm });

    const contractIds = accountAssetsFiltered.value.map((a) => a.contractId);
    expect(contractIds).toEqual(['ct_gamma']);
  });
});
