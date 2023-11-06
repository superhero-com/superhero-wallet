import type { ProtocolViewsConfig } from '@/types';

const protocolViews: ProtocolViewsConfig = {
  AccountDetails: () => import(
    /* webpackChunkName: "ae-account-details" */
    './AccountDetails.vue'
  ),
  AccountDetailsTokens: () => import(
    /* webpackChunkName: "ae-account-details-tokens" */
    './AccountDetailsTokens.vue'
  ),
  AccountDetailsNames: () => import(
    /* webpackChunkName: "ae-account-details-names" */
    './AccountDetailsNames.vue'
  ),
  TransactionDetails: () => import(
    /* webpackChunkName: "ae-transaction-details" */
    './TransactionDetails.vue'
  ),
  TransferReceiveModal: () => import(
    /* webpackChunkName: "ae-transfer-receive-modal" */
    './TransferReceiveModal.vue'
  ),
  TransferSendModal: () => import(
    /* webpackChunkName: "ae-transfer-send-modal" */
    './TransferSendModal.vue'
  ),
};

export default protocolViews;
