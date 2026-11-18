import { ref } from 'vue';
import type { Encoded } from '@aeternity/aepp-sdk';

import type { ITransaction } from '@/types';
import { PROTOCOLS } from '@/constants';
import { useTransactionData } from '@/composables/transactionData';
import { useAeTokenSales } from '@/protocols/aeternity/composables/aeTokenSales';

const SALE = 'ct_wS3iFu3UkvprrkreRdjJJ8RrK9tLou5LeBBSbiPbmf6g51gvt';
const TOKEN = 'ct_i4snWcikpnCNdxGsG5EoipAJSWHsGVVisoVo9jyBYxvz8W4Za';
const OWNER = 'ak_AzQPCBHpxSdNURATT41CZANu8WTxtvxeUY33z4dgbDfyA6PtJ';

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

describe('useAeTokenSales', () => {
  beforeEach(() => {
    tokenSales.value = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (
      url.endsWith(`/tokens/${SALE}`)
        ? new Response(JSON.stringify(tokenResponse))
        : new Response('', { status: 200 })
    )));
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
});
