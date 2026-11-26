import { ref } from 'vue';
import { Tag } from '@aeternity/aepp-sdk';

import { useTransactionData } from '@/composables/transactionData';
import { PROTOCOLS } from '@/constants';
import { STUB_TRANSACTIONS } from '@/constants/stubs';
import { i18n } from '@/popup/plugins/i18n';
import en from '@/popup/locales/en-US.json';
import zh from '@/popup/locales/zh-CN.json';
import type { ITransaction } from '@/types';

function nameClaim(
  tx: Record<string, unknown> = {},
  transaction: Partial<ITransaction> = {},
): ITransaction {
  return {
    ...STUB_TRANSACTIONS.nameClaim,
    pending: false,
    ...transaction,
    tx: { ...STUB_TRANSACTIONS.nameClaim.tx, name: 'bid.chain', ...tx },
  } as unknown as ITransaction;
}

function labels(transaction: ITransaction | undefined) {
  const { txTypeLabel, txTypeListLabel } = useTransactionData({ transaction: ref(transaction) });
  return [txTypeLabel.value, txTypeListLabel.value];
}

const claimLabels = [en.transaction.type.nameClaimTx, en.transaction.listType.nameClaimTx];
const bidLabels = ['Bid on name', 'Name bid placed'];
const originalLocale = i18n.global.locale.value;

beforeEach(() => {
  i18n.global.locale.value = 'en';
});

afterEach(() => {
  i18n.global.locale.value = originalLocale;
});

describe('name auction transaction labels', () => {
  // The first claim after a preclaim has nonzero salt; subsequent bids use zero.
  it.each([0, '0', BigInt(0), 4242, '4242', undefined])(
    'labels an auction claim as a bid with salt %s',
    (nameSalt) => {
      expect(labels(nameClaim({ nameSalt }))).toEqual(bidLabels);
    },
  );

  it.each([
    ['abcdefghijkl.chain', bidLabels],
    ['abcdefghijklm.chain', claimLabels],
    ['\u00e9.chain', bidLabels],
    ['\u00e9'.repeat(12).concat('.chain'), claimLabels],
  ])('uses the normalized auction length for %s', (name, expected) => {
    expect(labels(nameClaim({ name, nameSalt: '0' }))).toEqual(expected);
  });

  it.each([0, '0', 4242, undefined])(
    'keeps ordinary long-name claims as claims with salt %s',
    (nameSalt) => {
      // Since Ceres, a direct long-name claim can also have zero salt.
      expect(labels(nameClaim({ name: 'ordinarylongname.chain', nameSalt }))).toEqual(claimLabels);
    },
  );

  it.each([undefined, null, '', 123, {}, 'bid.test', '.chain', '-bid.chain', 'bid..chain'])(
    'keeps the existing label for a missing or invalid name: %s',
    (name) => {
      expect(labels(nameClaim({ name, nameSalt: '0' }))).toEqual(claimLabels);
    },
  );

  it('keeps other transaction types and protocols unchanged', () => {
    expect(labels(nameClaim({ type: 'NameUpdateTx', nameSalt: '0' }))).toEqual([
      en.transaction.type.nameUpdateTx,
      en.transaction.listType.nameUpdateTx,
    ]);
    expect(labels(nameClaim({}, { protocol: PROTOCOLS.ethereum }))).toEqual(claimLabels);
    expect(labels(undefined)).toEqual(['', '']);
  });

  it.each([
    [Tag.GaMetaTx, en.transaction.type.gaMetaTx],
    [Tag.PayingForTx, en.transaction.type.payingForTx],
  ])('preserves the outer label for wrapper tag %s', (tag, expectedLabel) => {
    const innerClaim = nameClaim({ nameSalt: '0' }).tx;
    const wrapped = nameClaim({
      tag,
      type: Tag[tag],
      tx: { signatures: [], tx: innerClaim },
    });

    expect(labels(wrapped)).toEqual([expectedLabel, '']);
  });

  it('recomputes labels when a pending transaction is replaced by the mined transaction', () => {
    const transaction = ref(nameClaim({ name: undefined }, { pending: true }));
    const { txTypeLabel, txTypeListLabel, outerTxTag } = useTransactionData({ transaction });

    expect([txTypeLabel.value, txTypeListLabel.value]).toEqual(claimLabels);

    transaction.value = nameClaim({ nameSalt: '0' });
    expect([txTypeLabel.value, txTypeListLabel.value]).toEqual(bidLabels);
    expect(outerTxTag.value).toBe(Tag.NameClaimTx);

    transaction.value = nameClaim({ name: 'ordinarylongname.chain', nameSalt: '0' });
    expect([txTypeLabel.value, txTypeListLabel.value]).toEqual(claimLabels);
  });

  it('updates both bid labels when the locale changes', () => {
    const { txTypeLabel, txTypeListLabel } = useTransactionData({ transaction: ref(nameClaim()) });
    expect([txTypeLabel.value, txTypeListLabel.value]).toEqual(bidLabels);

    i18n.global.setLocaleMessage('zh-CN', zh);
    i18n.global.locale.value = 'zh-CN';
    expect([txTypeLabel.value, txTypeListLabel.value]).toEqual([
      zh.transaction.type.nameBid,
      zh.transaction.listType.nameBid,
    ]);
  });
});
