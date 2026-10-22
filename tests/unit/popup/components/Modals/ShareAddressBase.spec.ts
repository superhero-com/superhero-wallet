import { shallowMount } from '@vue/test-utils';
import { ref as mockRef } from 'vue';
import { PROTOCOLS } from '@/constants';
import { AE_CONTRACT_ID, AE_SYMBOL } from '@/protocols/aeternity/config';
import { BTC_CONTRACT_ID } from '@/protocols/bitcoin/config';
import ShareAddressBase from '@/popup/components/Modals/ShareAddressBase.vue';

const mockInvokeDeviceShare = vi.fn();
const mockCopy = vi.fn();
const mockT = vi.fn((key: string) => key);

const AE_ADDRESS = 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR';
const BTC_ADDRESS = 'tb1qfj2mhhv3x0uw0w4jf8fhxq5jg9a6z8zptlq9q3';
const TOKEN_CONTRACT_ID = 'ct_mijZGKXeqQBS1dDmdJbbrDzKRrP58XLjJ2u5edkwafzfcXMsY';

vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  invokeDeviceShare: (text: string) => mockInvokeDeviceShare(text),
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: mockT }),
}));

vi.mock('@/composables', () => ({
  useAccounts: () => ({ activeAccount: mockRef({}) }),
  useCopy: () => ({ copy: mockCopy, copied: mockRef(false) }),
  useFungibleTokens: () => ({ loadSingleToken: vi.fn() }),
}));

vi.mock('@/lib/ProtocolAdapterFactory', async () => {
  const { AE_CONTRACT_ID: aeContractId, AE_SYMBOL: aeSymbol } = await import('@/protocols/aeternity/config');
  const { BTC_CONTRACT_ID: btcContractId } = await import('@/protocols/bitcoin/config');
  const adapters: Record<string, object> = {
    aeternity: {
      protocolName: 'æternity',
      coinSymbol: aeSymbol,
      coinContractId: aeContractId,
      coinPrecision: 18,
      getUrlTokenKey: () => aeSymbol,
    },
    bitcoin: {
      protocolName: 'Bitcoin',
      coinSymbol: 'BTC',
      coinContractId: btcContractId,
      coinPrecision: 8,
      getUrlTokenKey: () => btcContractId,
    },
  };
  return {
    ProtocolAdapterFactory: { getAdapter: (protocol: string) => adapters[protocol] },
  };
});

function mountShareAddress(protocol: string, accountAddress: string) {
  return shallowMount(ShareAddressBase, {
    props: { protocol, accountAddress, isReceive: true },
    global: { mocks: { $t: (key: string) => key } },
  });
}

async function getSharedLinkQuery(wrapper: ReturnType<typeof mountShareAddress>) {
  await (wrapper.vm as any).share();
  const [key, params] = mockT.mock.calls.at(-1)!;
  return {
    key,
    params,
    query: Object.fromEntries(new URL(params.walletLink).searchParams),
  };
}

describe('ShareAddressBase', () => {
  beforeEach(() => {
    mockInvokeDeviceShare.mockClear();
    mockCopy.mockClear();
    mockT.mockClear();
  });

  it('keeps the recipient in the shared link when no amount is requested', async () => {
    const wrapper = mountShareAddress(PROTOCOLS.aeternity, AE_ADDRESS);
    (wrapper.vm as any).handleAssetChange({ contractId: AE_CONTRACT_ID, symbol: AE_SYMBOL });

    const { key, params, query } = await getSharedLinkQuery(wrapper);

    expect(key).toBe('modals.receive.shareTextNoAmount');
    expect(params.address).toBe(AE_ADDRESS);
    expect(query).toEqual({
      op: 'transferSend',
      protocol: PROTOCOLS.aeternity,
      token: AE_SYMBOL,
      account: AE_ADDRESS,
    });
    expect(mockInvokeDeviceShare).toHaveBeenCalledTimes(1);
  });

  it('tells the opening wallet which protocol to use when no amount is requested', async () => {
    const wrapper = mountShareAddress(PROTOCOLS.bitcoin, BTC_ADDRESS);
    (wrapper.vm as any).handleAssetChange({ contractId: BTC_CONTRACT_ID, symbol: 'BTC' });

    const { query } = await getSharedLinkQuery(wrapper);

    expect(query).toEqual({
      op: 'transferSend',
      protocol: PROTOCOLS.bitcoin,
      token: BTC_CONTRACT_ID,
      account: BTC_ADDRESS,
    });
  });

  it('falls back to the protocol coin before an asset is selected', async () => {
    const wrapper = mountShareAddress(PROTOCOLS.bitcoin, BTC_ADDRESS);

    const { query } = await getSharedLinkQuery(wrapper);

    expect(query.token).toBe(BTC_CONTRACT_ID);
    expect(query.account).toBe(BTC_ADDRESS);
  });

  it('shares the requested token and amount with the selected token symbol', async () => {
    const wrapper = mountShareAddress(PROTOCOLS.aeternity, AE_ADDRESS);
    (wrapper.vm as any).handleAssetChange({ contractId: TOKEN_CONTRACT_ID, symbol: 'TT' });
    (wrapper.vm as any).amount = '1.5';

    const { key, params, query } = await getSharedLinkQuery(wrapper);

    expect(key).toBe('modals.receive.shareTextWithAmount');
    expect(params.amount).toBe('1.5');
    expect(params.coinSymbol).toBe('TT');
    expect(query).toEqual({
      op: 'transferSend',
      protocol: PROTOCOLS.aeternity,
      token: TOKEN_CONTRACT_ID,
      amount: '1.5',
      account: AE_ADDRESS,
    });
  });

  it('copies the plain address when no amount is requested', () => {
    const wrapper = mountShareAddress(PROTOCOLS.aeternity, AE_ADDRESS);

    (wrapper.vm as any).copyAddress();

    expect(mockCopy).toHaveBeenCalledWith(AE_ADDRESS);
  });
});
