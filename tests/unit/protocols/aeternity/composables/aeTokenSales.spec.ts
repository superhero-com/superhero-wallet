import { defineComponent, ref } from 'vue';
import { enableAutoUnmount, mount } from '@vue/test-utils';
import type { Encoded } from '@aeternity/aepp-sdk';

import type { ITransaction } from '@/types';
import { NETWORK_NAME_MAINNET, NETWORK_NAME_TESTNET, PROTOCOLS } from '@/constants';
import { i18n } from '@/popup/plugins/i18n';
import { useNetworks } from '@/composables/networks';
import { useTransactionData } from '@/composables/transactionData';
import { useAeTokenSales } from '@/protocols/aeternity/composables/aeTokenSales';
import TransactionListItem from '@/popup/components/TransactionListItem.vue';

const SALE = 'ct_wS3iFu3UkvprrkreRdjJJ8RrK9tLou5LeBBSbiPbmf6g51gvt';
const TOKEN = 'ct_i4snWcikpnCNdxGsG5EoipAJSWHsGVVisoVo9jyBYxvz8W4Za';
const OWNER = 'ak_AzQPCBHpxSdNURATT41CZANu8WTxtvxeUY33z4dgbDfyA6PtJ';
const OTHER_SALE = 'ct_2QFSEgsU4hknD3Wftxn3dHeTaYeYp4etVafNknaXJYK7QbLYbY';
const NOT_A_SALE = 'ct_9ZtX8EfXP62Vn3cmYaKiqyKcHLBZQ9L2PigwVM4SFvkFEjnJQ';
const NOT_FOUND = 'ct_aC5wac2tNTAEhbGpbFyV5S7yfxADxcTwVjVSQubgsevXhkyas';
// Every lookup is kept for the run, so each test asks about sales of its own
const KNOWN_SALE = 'ct_256DtWGm2GevM4QF4UKHukUaJe9LbqCn7igF9suqLvz19HeTW9';
const RETRIED_SALE = 'ct_2RJAjxhBWXkmPHykLDXaKqdvnH5gXwxRoeA3WEY7qXdoWpqLVi';
const SWITCHED_SALE = 'ct_28w7VyXS6UDNbyWZxZLtxpDKJorfpYyBQM4f9quseFEByUeDpb';
const SALES = [SALE, RETRIED_SALE, SWITCHED_SALE];

// The shape of the Superhero API `GET /tokens/{address}`
const tokenResponse = {
  address: TOKEN,
  sale_address: SALE,
  creator_address: OWNER,
  owner_address: OWNER,
  name: 'WORD',
  symbol: 'WORD',
  decimals: '18',
  price: '0.01',
};

const { tokenSales, tokenSaleAddresses, loadTokenSalesInfoByContractId } = useAeTokenSales();

function buyCall(contractId: string): ITransaction {
  return {
    hash: 'th_21rHLYGTfjKtXSdyfLVoesasEN5fzA7sVQb95JhLGvKPE2oTo3',
    protocol: PROTOCOLS.aeternity,
    transactionOwner: OWNER,
    tx: {
      type: 'ContractCallTx',
      callerId: OWNER,
      contractId,
      function: 'buy',
      arguments: [{ type: 'int', value: '5000000000000000000' }],
      amount: 1e17,
      fee: 1e14,
      returnType: 'ok',
    },
  } as unknown as ITransaction;
}

enableAutoUnmount(afterEach);

function mountTransactionData(transaction: ITransaction, lookUpTokenSale = true) {
  let data: ReturnType<typeof useTransactionData>;
  mount(defineComponent({
    setup() {
      data = useTransactionData({ transaction: ref(transaction), lookUpTokenSale });
      return () => null;
    },
  }), { global: { plugins: [i18n] } });
  return data!;
}

function mountListItem(transaction: ITransaction) {
  return mount(TransactionListItem, {
    global: {
      plugins: [i18n],
      stubs: { ListItemWrapper: { template: '<div><slot /></div>' }, TransactionAssetRows: true },
    },
    props: { transaction },
  });
}

let fetchMock: ReturnType<typeof vi.fn>;
const requestedUrls = () => fetchMock.mock.calls.map(([url]) => url as string);
const tokenRequests = (contractId: string) => requestedUrls()
  .filter((url) => url.endsWith(`/tokens/${contractId}`));
const settle = () => new Promise((resolve) => setTimeout(resolve));

describe('useAeTokenSales', () => {
  beforeEach(() => {
    tokenSales.value = [];
    fetchMock = vi.fn(async (url: string) => {
      const sale = SALES.find((address) => url.endsWith(`/tokens/${address}`));
      if (sale) {
        return new Response(JSON.stringify({ ...tokenResponse, sale_address: sale }));
      }
      if (url.endsWith(`/tokens/${NOT_FOUND}`)) {
        return new Response('', { status: 404 });
      }
      if (url.endsWith(`/v3/aex9/${TOKEN}`)) {
        return new Response(JSON.stringify({
          contract_id: TOKEN, name: 'WORD', symbol: 'WORD', decimals: 18,
        }));
      }
      if (url.endsWith('/contracts')) {
        return new Response('[]');
      }
      // The API answers an unknown contract with an empty body
      return new Response('', { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stores a sale looked up by its contract with its sale address', async () => {
    await loadTokenSalesInfoByContractId(SALE as Encoded.ContractAddress);

    expect(tokenSaleAddresses.value).toEqual([SALE]);
    expect(tokenSales.value[0]).toMatchObject({
      address: TOKEN,
      saleAddress: SALE,
      creatorAddress: OWNER,
    });
  });

  it('replaces a stored entry of the same token with the one looked up', async () => {
    tokenSales.value = [{ address: TOKEN, name: 'WORD' } as any];

    await loadTokenSalesInfoByContractId(SALE as Encoded.ContractAddress);

    expect(tokenSaleAddresses.value).toEqual([SALE]);
  });

  it('does not take a spend for a token sale when a stored sale has no sale address', () => {
    tokenSales.value = [{ address: TOKEN, name: 'WORD' } as any];
    const spend = {
      hash: 'th_2QcxMg7FmhousM56HEagXQ6ke29FrddG98bSKKB9Z9gCibyxy6',
      protocol: PROTOCOLS.aeternity,
      transactionOwner: OWNER,
      tx: {
        type: 'SpendTx', senderId: OWNER, recipientId: OWNER, amount: 1, fee: 1,
      },
    } as unknown as ITransaction;

    const { isTokenSale } = useTransactionData({ transaction: ref(spend) });

    expect(isTokenSale.value).toBe(false);
  });

  it('looks up the sale of a listed buy once and shows what was bought', async () => {
    const items = [mountListItem(buyCall(SALE)), mountListItem(buyCall(SALE))];

    await vi.waitFor(() => items.forEach((item) => {
      expect(item.find('.type').text()).toContain('Bought');
      expect(item.findComponent({ name: 'TransactionAssetRows' }).props('assets')[0].symbol)
        .toBe('WORD');
    }));
    expect(tokenRequests(SALE)).toHaveLength(1);
  });

  it.each([
    ['with an empty body', NOT_A_SALE],
    ['with a 404', NOT_FOUND],
  ])('asks about a contract that is no sale only once, answered %s', async (_, contractId) => {
    mountTransactionData(buyCall(contractId));
    await vi.waitFor(() => expect(tokenRequests(contractId)).toHaveLength(1));
    await settle();
    mountTransactionData(buyCall(contractId));
    await settle();

    expect(tokenRequests(contractId)).toHaveLength(1);
    expect(tokenSales.value).toEqual([]);
  });

  it('asks again after the token sales API failed', async () => {
    const answer = fetchMock.getMockImplementation()!;
    let isApiDown = true;
    fetchMock.mockImplementation((url: string) => (
      isApiDown && url.includes('/tokens/')
        ? Promise.reject(new TypeError('Failed to fetch'))
        : answer(url)
    ));

    mountTransactionData(buyCall(RETRIED_SALE));
    await vi.waitFor(() => expect(tokenRequests(RETRIED_SALE)).toHaveLength(1));
    await settle();
    isApiDown = false;
    const row = mountTransactionData(buyCall(RETRIED_SALE));

    await vi.waitFor(() => expect(row.isTokenSaleBuy.value).toBe(true));
    expect(tokenRequests(RETRIED_SALE)).toHaveLength(2);
  });

  it('looks nothing up for a known sale or without the option', async () => {
    tokenSales.value = [{ address: TOKEN, saleAddress: KNOWN_SALE } as any];
    mountTransactionData(buyCall(KNOWN_SALE));
    mountTransactionData(buyCall(OTHER_SALE), false);
    await settle();

    expect(requestedUrls()).toEqual([]);
  });

  it('drops a sale answered after a network switch and asks again on the new one', async () => {
    const answer = fetchMock.getMockImplementation()!;
    let respond: (() => void) | undefined;
    fetchMock.mockImplementation((url: string) => (
      url.endsWith(`/tokens/${SWITCHED_SALE}`) && !respond
        ? new Promise((resolve) => { respond = () => resolve(answer(url)); })
        : answer(url)
    ));

    mountTransactionData(buyCall(SWITCHED_SALE));
    await vi.waitFor(() => expect(respond).toBeDefined());
    useNetworks().switchNetwork(NETWORK_NAME_TESTNET);
    try {
      respond!();
      await settle();
      expect(tokenSales.value).toEqual([]);

      mountTransactionData(buyCall(SWITCHED_SALE));
      await vi.waitFor(() => expect(tokenRequests(SWITCHED_SALE)).toHaveLength(2));
    } finally {
      // While `fetch` is still stubbed
      useNetworks().switchNetwork(NETWORK_NAME_MAINNET);
      await settle();
    }
  });
});
