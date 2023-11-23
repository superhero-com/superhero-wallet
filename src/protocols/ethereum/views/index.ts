import type { ProtocolViewsConfig } from '@/types';

const protocolViews: ProtocolViewsConfig = {
  AccountDetails: () => import(
    /* webpackChunkName: "eth-account-details" */
    './AccountDetails.vue'
  ),
  AccountDetailsTransactions: () => import(
    /* webpackChunkName: "eth-account-details-transactions" */
    './AccountDetailsTransactions.vue'
  ),
  AccountDetailsTokens: () => import(
    /* webpackChunkName: "eth-account-details-tokens" */
    './AccountDetailsTokens.vue'
  ),
  AccountDetailsNames: null,
  TransactionDetails: () => import(
    /* webpackChunkName: "eth-transaction-details" */
    './TransactionDetails.vue'
  ),
  TransferReceiveModal: () => import(
    /* webpackChunkName: "eth-transfer-receive-modal" */
    './TransferReceiveModal.vue'
  ),
  TransferSendModal: () => import(
    /* webpackChunkName: "eth-transfer-send-modal" */
    './TransferSendModal.vue'
  ),
};

export default protocolViews;
