import type { ITransaction, ITx } from '@/types';
import {
  AE_NETWORK_MAINNET_ID,
  AE_NETWORK_TESTNET_ID,
  DEX_CONTRACTS,
  SUPERHERO_CONTRACTS,
} from '@/protocols/aeternity/config';
import { getSuperheroTxAction } from '@/protocols/aeternity/helpers';

const contracts = SUPERHERO_CONTRACTS[AE_NETWORK_MAINNET_ID];
const [posts] = contracts.posts;
const [socialGraph] = contracts.socialGraph;
const [governance] = contracts.governance;
const [affiliation] = contracts.affiliation;
const [wae] = DEX_CONTRACTS[AE_NETWORK_MAINNET_ID].wae;
const OTHER_CONTRACT = 'ct_2QFSEgsU4hknD3Wftxn3dHeTaYeYp4etVafNknaXJYK7QbLYbY';
const TARGET = 'ak_FfKJsMbXte7J8JNAfZzxvEaVRLXvAtm857vWME4oJz33hFYnk';

function contractCall(
  contractId: string,
  fn: string,
  args: ITx['arguments'] = [],
): ITransaction {
  return {
    tx: {
      type: 'ContractCallTx',
      contractId,
      function: fn,
      arguments: args,
      amount: 0,
      fee: 0,
    },
  } as unknown as ITransaction;
}

function postCall(contractId: string, media: string[]) {
  return contractCall(contractId, 'post_without_tip', [
    { type: 'string', value: 'Hello' },
    { type: 'list', value: media.map((value) => ({ type: 'string', value })) },
  ]);
}

describe('getSuperheroTxAction', () => {
  it.each([
    ['post', postCall(posts, [])],
    ['post', postCall(posts, ['https://example.com/image.png'])],
    ['comment', postCall(posts, ['comment:13036_v3', 'https://example.com/image.png'])],
    ['follow', contractCall(socialGraph, 'follow', [{ type: 'address', value: TARGET }])],
    ['unfollow', contractCall(socialGraph, 'unfollow', [{ type: 'address', value: TARGET }])],
    ['block', contractCall(socialGraph, 'block', [{ type: 'address', value: TARGET }])],
    ['unblock', contractCall(socialGraph, 'unblock', [{ type: 'address', value: TARGET }])],
    ['delegate', contractCall(governance, 'delegate', [{ type: 'address', value: TARGET }])],
    ['revokeDelegation', contractCall(governance, 'revoke_delegation')],
    ['addPoll', contractCall(governance, 'add_poll')],
    ['createInvites', contractCall(affiliation, 'register_invitation_code')],
    ['revokeInvite', contractCall(affiliation, 'revoke_invitation_code')],
    ['collectRewards', contractCall(affiliation, 'withdraw')],
    ['redeemInvite', contractCall(affiliation, 'redeem_invitation_code', [
      { type: 'address', value: TARGET },
    ])],
  ])('recognises %s', (action, transaction) => {
    expect(getSuperheroTxAction(transaction, contracts)).toBe(action);
  });

  it('recognises a call wrapped in a PayingForTx', () => {
    const { tx } = postCall(posts, []);
    const transaction = {
      tx: { type: 'PayingForTx', payerId: TARGET, tx: { tx } },
    } as unknown as ITransaction;
    expect(getSuperheroTxAction(transaction, contracts)).toBe('post');
  });

  describe('payout of a redeemed invite', () => {
    const tx = {
      type: 'SpendTx',
      senderId: affiliation.replace('ct_', 'ak_'),
      recipientId: TARGET,
      amount: 1e18,
    } as unknown as ITx;
    const payout = { hash: 'th_2C8i6i99eUz3c8iCPJnGBqWfqxu9cSAS843pTfocgkRLVAYv6x', tx } as ITransaction;

    it('is recognised', () => {
      expect(getSuperheroTxAction(payout, contracts)).toBe('redeemInvite');
    });

    it('needs the treasury as the sender', () => {
      expect(getSuperheroTxAction({ ...payout, tx: { ...tx, senderId: TARGET } }, contracts))
        .toBeNull();
      expect(getSuperheroTxAction(payout, SUPERHERO_CONTRACTS[AE_NETWORK_TESTNET_ID])).toBeNull();
    });

    it('is no transaction to sign, which has no hash', () => {
      expect(getSuperheroTxAction({ tx } as ITransaction, contracts)).toBeNull();
    });
  });

  it('reads comments from the call data decoded by the sign modal', () => {
    // ConfirmTransactionSign maps list arguments to `{ value }` items without a type
    const transaction = contractCall(posts, 'post_without_tip', [
      { type: 'any', value: 'Hello' },
      { type: 'list', value: [{ value: 'comment:1_v3' }] },
    ] as ITx['arguments']);
    expect(getSuperheroTxAction(transaction, contracts)).toBe('comment');
  });

  it.each([
    ['a post on another contract', postCall(OTHER_CONTRACT, [])],
    ['a follow on another contract', contractCall(OTHER_CONTRACT, 'follow')],
    ['a WAE withdraw', contractCall(wae, 'withdraw')],
    ['a posts contract call of another entrypoint', contractCall(posts, 'withdraw')],
    ['a governance call of a social graph entrypoint', contractCall(governance, 'follow')],
    ['a social graph call of an affiliation entrypoint', contractCall(socialGraph, 'withdraw')],
    ['an inherited property name', contractCall(socialGraph, 'constructor')],
  ])('ignores %s', (_, transaction) => {
    expect(getSuperheroTxAction(transaction, contracts)).toBeNull();
  });

  it('ignores mainnet contracts on testnet', () => {
    expect(getSuperheroTxAction(
      postCall(posts, []),
      SUPERHERO_CONTRACTS[AE_NETWORK_TESTNET_ID],
    )).toBeNull();
  });

  it('ignores everything on networks without Superhero contracts', () => {
    expect(getSuperheroTxAction(postCall(posts, []), undefined)).toBeNull();
  });

  it('ignores transactions without a function', () => {
    const { tx } = postCall(posts, []);
    expect(getSuperheroTxAction({ tx: { ...tx, function: undefined } } as ITransaction, contracts))
      .toBeNull();
  });
});
