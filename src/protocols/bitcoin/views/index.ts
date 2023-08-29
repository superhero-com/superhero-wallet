import type { ProtocolViewsConfig } from '@/types';

const protocolViews: ProtocolViewsConfig = {
  AccountDetails: () => import(
    /* webpackChunkName: "btc-account-details" */
    './AccountDetails.vue'
  ),
  AccountDetailsTransactions: () => import(
    /* webpackChunkName: "btc-account-details-transactions" */
    './AccountDetailsTransactions.vue'
  ),
  TransactionDetails: () => import(
    /* webpackChunkName: "ae-transaction-details" */
    './TransactionDetails.vue'
  ),
  TransferReceiveModal: () => import(
    /* webpackChunkName: "btc-transfer-receive-modal" */
    './TransferReceiveModal.vue'
  ),
  TransferSendModal: () => import(
    /* webpackChunkName: "btc-transfer-send-modal" */
    './TransferSendModal.vue'
  ),
};

export default protocolViews;
