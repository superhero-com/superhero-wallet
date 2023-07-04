import { mount } from '@vue/test-utils';
import Vuex from 'vuex';
import TransactionTagList from '../../src/popup/components/TransactionTagList.vue';
import { i18n, tg } from '../../src/store/plugins/languages';
import { transactions, testAccount } from '../../src/popup/utils/testsConfig';
import {
  AENS,
  NETWORK_TESTNET,
  STUB_TOKEN_CONTRACT_ADDRESS,
} from '../../src/popup/utils';

const store = new Vuex.Store({
  getters: {
    activeNetwork: () => NETWORK_TESTNET,
  },
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
    props: { transaction: transactions[key] },
    labels: value,
  })),
  ...[
    transactions.pendingSpend,
    transactions.pendingTransfer,
    transactions.transfer,
    transactions.spend,
  ].map((t) => ({
    props: { transaction: t },
    labels: [tg('transaction.type.spendTx'), tg('transaction.spendType.out')],
  })),
  ...[
    transactions.pendingSpend,
    transactions.pendingTransfer,
    transactions.transfer,
    transactions.spend,
  ].map((t) => ({
    props: { transaction: { ...t, transactionOwner: testAccount.address } },
    labels: [tg('transaction.type.spendTx'), tg('transaction.spendType.in')],
  })),
  ...[
    transactions.pendingTipAe,
    transactions.pendingTipToken,
    transactions.tip,
    transactions.retip,
  ].map((t) => ({
    props: { transaction: t },
    labels: [tg('pages.token-details.tip'), tg('transaction.spendType.out')],
  })),
  ...[transactions.tipToken, transactions.retipToken].map((t) => ({ // unsupported functions
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
