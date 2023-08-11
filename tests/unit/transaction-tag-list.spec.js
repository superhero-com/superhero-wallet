import { mount } from '@vue/test-utils';
import Vuex from 'vuex';
import TransactionTagList from '../../src/popup/components/TransactionTagList.vue';
import { i18n, tg } from '../../src/store/plugins/languages';
import {
  // STUB_ACCOUNT,
  STUB_TOKEN_CONTRACT_ADDRESS,
  STUB_TRANSACTIONS,
} from '../../src/constants/stubs';
import {
  AENS,
} from '../../src/constants';

const store = new Vuex.Store({
  state: {
    fungibleTokens: {
      availableTokens: {
        [STUB_TOKEN_CONTRACT_ADDRESS]: {},
      },
    },
  },
});

const transactionLabels = {
  payForGaAttach: [
    tg('transaction.type.payingForTx'),
    tg('transaction.type.createMultisigVault'),
  ],
  gaMetaSpend: [
    tg('transaction.type.gaMetaTx'),
    tg('transaction.type.spendTx'),
    tg('transaction.spendType.out'),
  ],
  claim: [
    tg('pages.token-details.tip'),
    tg('transaction.spendType.in')],
  changeAllowance: [
    tg('transaction.dexType.allowToken'),
  ],
  nameClaim: [
    AENS,
    tg('transaction.type.nameClaimTx'),
  ],
  transfer: [
    tg('transaction.type.spendTx'),
    tg('transaction.spendType.out'),
  ],
  spend: [
    tg('transaction.type.spendTx'),
    tg('transaction.spendType.out'),
  ],
  nameTransfer: [], // unsupported type
};

const testCases = [
  ...Object.entries(transactionLabels).map(([key, value]) => ({
    props: { transaction: STUB_TRANSACTIONS[key] },
    labels: value,
  })),
  ...[
    STUB_TRANSACTIONS.pendingSpend,
    STUB_TRANSACTIONS.pendingTransfer,
    STUB_TRANSACTIONS.transfer,
    STUB_TRANSACTIONS.spend,
  ].map((t) => ({
    props: { transaction: t },
    labels: [tg('transaction.type.spendTx'), tg('transaction.spendType.out')],
  })),
  // ...[
  //   STUB_TRANSACTIONS.pendingSpend,
  //   STUB_TRANSACTIONS.pendingTransfer,
  //   STUB_TRANSACTIONS.transfer,
  //   STUB_TRANSACTIONS.spend,
  // ].map((t) => ({
  //   props: { transaction: { ...t, transactionOwner: STUB_ACCOUNT.address } },
  //   labels: [tg('transaction.type.spendTx'), tg('transaction.spendType.in')],
  // })),
  // ...[
  //   STUB_TRANSACTIONS.pendingTipAe,
  //   STUB_TRANSACTIONS.pendingTipToken,
  //   STUB_TRANSACTIONS.tip,
  //   STUB_TRANSACTIONS.retip,
  // ].map((t) => ({
  //   props: { transaction: t },
  //   labels: [tg('pages.token-details.tip'), tg('transaction.spendType.out')],
  // })),
  ...[
    STUB_TRANSACTIONS.tipToken,
    STUB_TRANSACTIONS.retipToken,
  ].map((t) => ({ // unsupported functions
    props: { transaction: t },
    labels: [t.tx.function, tg('transaction.type.contractCallTx')],
  })),
  {
    props: { transaction: { tx: { type: 'ContractCreateTx' } } },
    labels: [tg('transaction.type.contractCreateTx')],
  },
  {
    props: { transaction: { pending: true, tx: { type: 'ContractCreateTx' } } },
    labels: [],
  },
  {
    props: { customTitle: 'customTitle' },
    labels: ['customTitle'],
  },
  {
    props: {},
    labels: [],
  },
];

describe('TransactionTagList', () => {
  testCases.forEach(({ props, labels }) => it(
    `should have correct labels for each type of transaction: for \
  ${props.transaction?.tx?.type ?? props.customTitle}/${props.transaction?.tx?.function}`,
    () => {
      const wrapper = mount(TransactionTagList, {
        global: { plugins: [i18n, store] },
        props,
      });
      wrapper.findAll('.transaction-tag').forEach((el, index) => {
        expect(el.text()).toEqual(labels[index] || '');
      });
    },
  ));
});
