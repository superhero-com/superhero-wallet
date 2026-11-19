/** The recipients the send form stops: coins spent to them are never mined. */
import { MemoryAccount } from '@aeternity/aepp-sdk';

import { fetchAeNotPayableRecipients } from '@/protocols/aeternity/helpers';

const toContractAddress = (address: string) => address.replace('ak_', 'ct_');

const ACCOUNT = MemoryAccount.generate().address;
const NEW_ACCOUNT = MemoryAccount.generate().address;
const NOT_PAYABLE_CONTRACT = toContractAddress(MemoryAccount.generate().address);
const PAYABLE_CONTRACT = toContractAddress(MemoryAccount.generate().address);
const NAME = 'contract.chain';
const NAME_WITHOUT_ACCOUNT = 'oracle.chain';

const nodeError = (statusCode: number) => Object.assign(
  new Error(`node said ${statusCode}`),
  { statusCode },
);

/** A node that knows the accounts and names above; it accepts both the ak_ and ct_ form. */
function createApi() {
  const payableByPubkey: Record<string, boolean> = {
    [ACCOUNT.slice(3)]: true,
    [NOT_PAYABLE_CONTRACT.slice(3)]: false,
    [PAYABLE_CONTRACT.slice(3)]: true,
  };
  return {
    getAccountByPubkey: vi.fn(async (address: string) => {
      const payable = payableByPubkey[address.slice(3)];
      if (payable === undefined) {
        throw nodeError(404);
      }
      return { payable } as any;
    }),
    getNameEntryByName: vi.fn(async (name: string) => {
      switch (name) {
        case NAME:
          return { pointers: [{ key: 'account_pubkey', id: NOT_PAYABLE_CONTRACT }] } as any;
        case NAME_WITHOUT_ACCOUNT:
          return { pointers: [{ key: 'oracle_pubkey', id: NOT_PAYABLE_CONTRACT }] } as any;
        default:
          throw nodeError(404);
      }
    }),
  };
}

describe('fetchAeNotPayableRecipients', () => {
  it('returns a contract that is not payable, by its ct_ and its ak_ address', async () => {
    const asAccount = NOT_PAYABLE_CONTRACT.replace('ct_', 'ak_');

    expect(await fetchAeNotPayableRecipients(createApi(), [NOT_PAYABLE_CONTRACT, asAccount]))
      .toEqual([NOT_PAYABLE_CONTRACT, asAccount]);
  });

  it('leaves out an account and a payable contract', async () => {
    expect(await fetchAeNotPayableRecipients(createApi(), [ACCOUNT, PAYABLE_CONTRACT]))
      .toEqual([]);
  });

  it('leaves out an account the node does not know, as the spend creates it', async () => {
    expect(await fetchAeNotPayableRecipients(createApi(), [NEW_ACCOUNT])).toEqual([]);
  });

  it('returns a name whose account pointer is a contract that is not payable', async () => {
    expect(await fetchAeNotPayableRecipients(createApi(), [NAME])).toEqual([NAME]);
  });

  it('only follows the account pointer of a name, as the chain does', async () => {
    const api = createApi();

    expect(await fetchAeNotPayableRecipients(api, [NAME_WITHOUT_ACCOUNT])).toEqual([]);
    expect(api.getAccountByPubkey).not.toHaveBeenCalled();
  });

  it('leaves out a name that is not registered', async () => {
    expect(await fetchAeNotPayableRecipients(createApi(), ['unknown.chain'])).toEqual([]);
  });

  it('leaves out a recipient it fails to look up', async () => {
    const api = createApi();
    api.getAccountByPubkey.mockRejectedValueOnce(nodeError(503));

    expect(await fetchAeNotPayableRecipients(api, [NOT_PAYABLE_CONTRACT])).toEqual([]);
  });

  it('skips a recipient that is not an address or a name, as a tip URL', async () => {
    const api = createApi();

    expect(await fetchAeNotPayableRecipients(api, ['https://example.com'])).toEqual([]);
    expect(api.getAccountByPubkey).not.toHaveBeenCalled();
  });

  it('keeps the order of the recipients', async () => {
    expect(await fetchAeNotPayableRecipients(
      createApi(),
      [NAME, ACCOUNT, NOT_PAYABLE_CONTRACT],
    )).toEqual([NAME, NOT_PAYABLE_CONTRACT]);
  });
});
