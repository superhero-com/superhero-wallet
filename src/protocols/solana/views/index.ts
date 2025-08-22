import type { ProtocolViewsConfig } from '@/types';

const protocolViews: ProtocolViewsConfig = {
  AccountDetails: () => import(
    /* webpackChunkName: "sol-account-details" */
    './AccountDetails.vue'
  ),
  AccountDetailsTokens: () => import(
    /* webpackChunkName: "sol-account-details-tokens" */
    './AccountDetailsTokens.vue'
  ),
  AccountDetailsNames: null,
  TransactionDetails: () => import(
    /* webpackChunkName: "sol-transaction-details" */
    './TransactionDetails.vue'
  ),
  TransferReceiveModal: () => import(
    /* webpackChunkName: "sol-transfer-receive-modal" */
    './TransferReceiveModal.vue'
  ),
  TransferSendModal: () => import(
    /* webpackChunkName: "sol-transfer-send-modal" */
    './TransferSendModal.vue'
  ),
};

export default protocolViews;
