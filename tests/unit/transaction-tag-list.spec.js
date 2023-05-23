import { mount } from '@vue/test-utils';
import Vuex from 'vuex';
import Vue from 'vue';
import TransactionTagList from '../../src/popup/components/TransactionTagList.vue';
import getters from '../../src/store/getters';
import { i18n } from '../../src/store/plugins/languages';
import { transactions, testAccount } from '../../src/popup/utils/testsConfig';
import {
  AENS,
  DEX_CONTRACTS,
  NETWORK_TESTNET,
  NETWORK_ID_TESTNET,
  STUB_ADDRESS,
  STUB_TOKEN_CONTRACT_ADDRESS,
} from '../../src/popup/utils';

Vue.use(Vuex);

const store = new Vuex.Store({
  getters: {
    activeNetwork: () => NETWORK_TESTNET,
    getDexContracts: () => ({ value: DEX_CONTRACTS[NETWORK_ID_TESTNET] }),
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
    i18n.t('transaction.type.payingForTx'),
    i18n.t('transaction.type.createMultisigVault'),
  ],
  gaMetaSpend: [
    i18n.t('transaction.type.gaMetaTx'),
    i18n.t('transaction.type.spendTx'),
    i18n.t('transaction.spendType.out'),
  ],
  claim: [i18n.t('pages.token-details.tip'), i18n.t('transaction.spendType.in')],
  changeAllowance: [i18n.t('transaction.dexType.allowToken')],
  nameClaim: [AENS, i18n.t('transaction.type.nameClaimTx')],
  transfer: [i18n.t('transaction.type.spendTx'), i18n.t('transaction.spendType.out')],
  spend: [i18n.t('transaction.type.spendTx'), i18n.t('transaction.spendType.out')],
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
    labels: [i18n.t('transaction.type.spendTx'), i18n.t('transaction.spendType.out')],
  })),
  ...[
    transactions.pendingSpend, transactions.pendingTransfer,
    transactions.transfer, transactions.spend,
  ].map((t) => ({
    props: { transaction: { ...t, transactionOwner: testAccount.address } },
    labels: [i18n.t('transaction.type.spendTx'), i18n.t('transaction.spendType.in')],
  })),
  ...[
    transactions.pendingTipAe, transactions.pendingTipToken,
    transactions.tip, transactions.retip,
  ].map((t) => ({
    props: { transaction: t },
    labels: [i18n.t('pages.token-details.tip'), i18n.t('transaction.spendType.out')],
  })),
  ...[transactions.tipToken, transactions.retipToken].map((t) => ({ // unsupported functions
    props: { transaction: t },
    labels: [t.tx.function, i18n.t('transaction.type.contractCallTx')],
  })),
  {
    props: { transaction: { tx: { type: 'ContractCreateTx' } } },
    labels: [i18n.t('transaction.type.contractCreateTx')],
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
        store,
        propsData: props,
      });
      wrapper.find('.transaction-tag-list').text()
        .replaceAll('\n', '').trim()
        .split('  ')
        .forEach((el, index) => expect(el).toEqual(labels[index] || ''));
    },
  ));
});
