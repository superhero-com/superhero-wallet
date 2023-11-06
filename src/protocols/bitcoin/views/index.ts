import type { ProtocolViewsConfig } from '@/types';

const protocolViews: ProtocolViewsConfig = {
  AccountDetails: () => import(
    /* webpackChunkName: "btc-account-details" */
    './AccountDetails.vue'
  ),
  AccountDetailsTokens: null,
  AccountDetailsNames: null,
  TransactionDetails: () => import(
    /* webpackChunkName: "btc-transaction-details" */
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
