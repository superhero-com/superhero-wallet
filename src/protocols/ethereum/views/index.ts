import type { ProtocolViewsConfig } from '@/types';

const protocolViews: ProtocolViewsConfig = {
  AccountDetails: null,
  AccountDetailsTransactions: null,
  AccountDetailsTokens: null,
  AccountDetailsNames: null,
  TransactionDetails: null,
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
