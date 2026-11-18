import { defineComponent, ref } from 'vue';
import { enableAutoUnmount, mount } from '@vue/test-utils';
import { Tag } from '@aeternity/aepp-sdk';
import type { ITransaction } from '@/types';
import { PROTOCOLS } from '@/constants';
import { i18n } from '@/popup/plugins/i18n';
import {
  AE_NETWORK_MAINNET_ID,
  DEX_CONTRACTS,
  SUPERHERO_CONTRACTS,
} from '@/protocols/aeternity/config';
import camelCaseKeysDeep from 'camelcase-keys-deep';
import { useAeSdk } from '@/composables/aeSdk';
import { useAeMiddleware } from '@/protocols/aeternity/composables/aeMiddleware';
import { useTransactionData } from '@/composables/transactionData';
import TransactionTagList from '@/popup/components/TransactionTagList.vue';
import TransactionLabel from '@/popup/components/TransactionLabel.vue';
import TransactionOverview from '@/popup/components/TransactionOverview.vue';

const contracts = SUPERHERO_CONTRACTS[AE_NETWORK_MAINNET_ID];
const [wae] = DEX_CONTRACTS[AE_NETWORK_MAINNET_ID].wae;
const OTHER_CONTRACT = 'ct_2QFSEgsU4hknD3Wftxn3dHeTaYeYp4etVafNknaXJYK7QbLYbY';
const CALLER = 'ak_AzQPCBHpxSdNURATT41CZANu8WTxtvxeUY33z4dgbDfyA6PtJ';
const TARGET = 'ak_FfKJsMbXte7J8JNAfZzxvEaVRLXvAtm857vWME4oJz33hFYnk';

function contractCall(
  contractId: string,
  fn: string,
  args: any[] = [],
): ITransaction {
  return {
    hash: 'th_2QcxMg7FmhousM56HEagXQ6ke29FrddG98bSKKB9Z9gCibyxy6',
    pending: false,
    protocol: PROTOCOLS.aeternity,
    microTime: 1760000000000,
    transactionOwner: CALLER,
    tx: {
      type: 'ContractCallTx',
      callerId: CALLER,
      contractId,
      function: fn,
      arguments: args,
      amount: 0,
      fee: 30000000000000,
      returnType: 'ok',
    },
  } as unknown as ITransaction;
}

const post = contractCall(contracts.posts[0], 'post_without_tip', [
  { type: 'string', value: 'Hello' },
  { type: 'list', value: [] },
]);
const comment = contractCall(contracts.posts[0], 'post_without_tip', [
  { type: 'string', value: 'Nice' },
  { type: 'list', value: [{ type: 'string', value: 'comment:13036_v3' }] },
]);
const follow = contractCall(contracts.socialGraph[0], 'follow', [
  { type: 'address', value: TARGET },
]);
const collectRewards = contractCall(contracts.affiliation[0], 'withdraw');
const waeWithdraw = contractCall(wae, 'withdraw', [{ type: 'int', value: '1000' }]);
const unknownPost = contractCall(OTHER_CONTRACT, 'post_without_tip', post.tx.arguments);

const INVITEE = 'ak_2SYHAH6gvgSiCrb7vgAdB29nTB4EhLosea7ptFRGWoxQaVJqhm';
const TREASURY = 'ak_2GG42rs2FDPTXuUCWHMn98bu5Ab6mgNxY7KdGAKUNsrLqutNxZ';
const redeemCall = contractCall(contracts.affiliation[0], 'redeem_invitation_code', [
  { type: 'address', value: INVITEE },
]);

// The invitee's mainnet activity for th_2C8i6i99…, where the factory is the `contract_id`
const inviteRedeem = useAeMiddleware().normalizeMiddlewareTransactionStructure(
  camelCaseKeysDeep({
    type: 'InternalContractCallEvent',
    block_time: 1780479539506,
    payload: {
      function: 'Chain.spend',
      contract_id: 'ct_25cqTw85wkF5cbcozmHHUCuybnfH9WaRZXSgEcNNXG9LsCJWTN',
      call_tx_hash: 'th_2C8i6i99eUz3c8iCPJnGBqWfqxu9cSAS843pTfocgkRLVAYv6x',
      internal_tx: {
        amount: 1000000000000000000,
        fee: 0,
        nonce: 0,
        payload: 'ba_Q2hhaW4uc3BlbmRFa4Tl',
        recipient_id: INVITEE,
        sender_id: TREASURY,
        type: 'SpendTx',
        version: 1,
      },
    },
  }),
  INVITEE,
);

const global = { plugins: [i18n] };

enableAutoUnmount(afterEach);

function getTags(transaction: ITransaction) {
  return mount(TransactionTagList, { global, props: { transaction } })
    .findAll('.transaction-tag')
    .map((el) => el.text());
}

function getTransactionData(transaction: ITransaction) {
  let data: ReturnType<typeof useTransactionData>;
  mount(defineComponent({
    setup() {
      data = useTransactionData({ transaction: ref(transaction) });
      return () => null;
    },
  }), { global });
  return data!;
}

describe('Superhero app transactions', () => {
  beforeAll(() => {
    useAeSdk().nodeNetworkId.value = AE_NETWORK_MAINNET_ID;
  });

  it.each([
    ['post', post, 'Post'],
    ['comment', comment, 'Comment'],
    ['follow', follow, 'Follow'],
    ['affiliation withdraw', collectRewards, 'Collect rewards'],
    ['redeemed invite', inviteRedeem, 'Redeem invite'],
    ['invite redeem call', redeemCall, 'Redeem invite'],
  ])('tags a %s as a Superhero transaction', (_, transaction, tag) => {
    expect(getTags(transaction)).toEqual(['Superhero', tag]);
  });

  it.each([
    ['post', post, 'Posted'],
    ['comment', comment, 'Commented'],
    ['follow', follow, 'Followed'],
    ['affiliation withdraw', collectRewards, 'Rewards collected'],
    ['redeemed invite', inviteRedeem, 'Invite redeemed'],
  ])('labels a %s on the transaction list', (_, transaction, label) => {
    const wrapper = mount(TransactionLabel, { global, props: { transaction } });
    expect(wrapper.find('.type').text().replace(',', '').trim()).toBe(label);
  });

  it('keeps the generic label for the same entrypoint on another contract', () => {
    expect(getTags(unknownPost)).toEqual(['Contract call']);
  });

  it('still tags the WAE withdraw as a DEX swap', () => {
    expect(getTags(waeWithdraw)).toEqual(['DEX', 'Swap']);
  });

  // The sign modal hides the total of DEX swaps
  it('does not treat a swap entrypoint of another contract as a DEX swap', () => {
    const data = getTransactionData(contractCall(OTHER_CONTRACT, 'swap_exact_ae_for_tokens'));
    expect(data.isDexSwap.value).toBe(false);
    expect(data.isDexMinReceived.value).toBe(false);
  });

  it('shows Superhero as the sender of a redeemed invite', () => {
    const wrapper = mount(TransactionOverview, {
      global: { ...global, stubs: { TransactionInfo: true } },
      props: { transaction: inviteRedeem },
    });
    const { sender, recipient } = wrapper.findComponent({ name: 'TransactionInfo' }).props();
    expect(sender.label).toBe('Superhero');
    expect(recipient.address).toBe(INVITEE);
  });

  // The sign modal passes the dapp's transaction, which has no hash
  it('does not take a transaction to sign from the treasury for a redeemed invite', () => {
    const transaction = {
      protocol: PROTOCOLS.aeternity,
      tx: {
        tag: Tag.SpendTx, senderId: TREASURY, recipientId: CALLER, amount: 1e18, fee: 2e13,
      },
    } as unknown as ITransaction;

    expect(getTags(transaction)).toEqual(['Spend', 'in']);
    const wrapper = mount(TransactionOverview, {
      global: { ...global, stubs: { TransactionInfo: true } },
      props: { transaction },
    });
    expect(wrapper.findComponent({ name: 'TransactionInfo' }).props('sender').label)
      .toBe('Account address');
  });

  it('shows the followed account as the recipient', () => {
    const wrapper = mount(TransactionOverview, {
      global: { ...global, stubs: { TransactionInfo: true } },
      props: { transaction: follow },
    });
    expect(wrapper.findComponent({ name: 'TransactionInfo' }).props('recipient').address)
      .toBe(TARGET);
  });
});
