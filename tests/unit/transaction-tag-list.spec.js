import { mount } from '@vue/test-utils';
import Vuex from 'vuex';
import TransactionTagList from '../../src/popup/components/TransactionTagList.vue';
import getters from '../../src/store/getters';
import { i18n } from '../../src/store/plugins/languages';
import { transactions, testAccount } from '../../src/popup/utils/testsConfig';
import {
  AENS,
  NETWORK_TESTNET,
  STUB_ADDRESS,
  STUB_TOKEN_CONTRACT_ADDRESS,
} from '../../src/popup/utils';

const store = new Vuex.Store({
  getters: {
    activeNetwork: () => NETWORK_TESTNET,
    getTxDirection: () => getters.getTxDirection(null, { account: { address: STUB_ADDRESS } }),
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
    i18n.global.t('transaction.type.payingForTx'),
    i18n.global.t('transaction.type.createMultisigVault'),
  ],
  gaMetaSpend: [
    i18n.global.t('transaction.type.gaMetaTx'),
    i18n.global.t('transaction.type.spendTx'),
    i18n.global.t('transaction.spendType.out'),
  ],
  claim: [i18n.global.t('pages.token-details.tip'), i18n.global.t('transaction.spendType.in')],
  changeAllowance: [i18n.global.t('transaction.dexType.allowToken')],
  nameClaim: [AENS, i18n.global.t('transaction.type.nameClaimTx')],
  transfer: [i18n.global.t('transaction.type.spendTx'), i18n.global.t('transaction.spendType.out')],
  spend: [i18n.global.t('transaction.type.spendTx'), i18n.global.t('transaction.spendType.out')],
  nameTransfer: [], // unsupported type
};

const testCases = [
  ...Object.entries(transactionLabels).map(([key, value]) => ({
    props: { transaction: transactions[key] },
    labels: value,
  })),
  ...[
    transactions.pendingSpend, transactions.pendingTransfer,
    transactions.transfer, transactions.spend,
  ].map((t) => ({
    props: { transaction: t },
    labels: [i18n.global.t('transaction.type.spendTx'), i18n.global.t('transaction.spendType.out')],
  })),
  ...[
    transactions.pendingSpend, transactions.pendingTransfer,
    transactions.transfer, transactions.spend,
  ].map((t) => ({
    props: { transaction: { ...t, transactionOwner: testAccount.address } },
    labels: [i18n.global.t('transaction.type.spendTx'), i18n.global.t('transaction.spendType.in')],
  })),
  ...[
    transactions.pendingTipAe, transactions.pendingTipToken,
    transactions.tip, transactions.retip,
  ].map((t) => ({
    props: { transaction: t },
    labels: [i18n.global.t('pages.token-details.tip'), i18n.global.t('transaction.spendType.out')],
  })),
  ...[transactions.tipToken, transactions.retipToken].map((t) => ({ // unsupported functions
    props: { transaction: t },
    labels: [t.tx.function, i18n.global.t('transaction.type.contractCallTx')],
  })),
  {
    props: { transaction: { tx: { type: 'ContractCreateTx' } } },
    labels: [i18n.global.t('transaction.type.contractCreateTx')],
  },
  {
    props: { transaction: { pending: true, tx: { type: 'ContractCreateTx' } } },
    labels: [],
  },
  {
    props: {},
    labels: [],
  },
  {
    props: { customTitle: 'customTitle' },
    labels: ['customTitle'],
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
