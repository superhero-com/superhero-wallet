import type { ProtocolViewsConfig } from '@/types';

const protocolViews: ProtocolViewsConfig = {
  AccountDetails: () => import(
    /* webpackChunkName: "btc-account-details" */
    './AccountDetails.vue'
  ),
  TransactionDetails: () => import(
    /* webpackChunkName: "ae-transaction-details" */
    './NotImplemented.vue' // TODO
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
