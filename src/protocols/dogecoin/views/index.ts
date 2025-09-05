import type { ProtocolViewsConfig } from '@/types';

const protocolViews: ProtocolViewsConfig = {
  AccountDetails: () => import(/* webpackChunkName: "doge-account-details" */ './AccountDetails.vue'),
  AccountDetailsTokens: null,
  AccountDetailsNames: null,
  TransactionDetails: () => import(/* webpackChunkName: "doge-transaction-details" */ './TransactionDetails.vue'),
  TransferReceiveModal: () => import(/* webpackChunkName: "doge-transfer-receive-modal" */ './TransferReceiveModal.vue'),
  TransferSendModal: () => import(/* webpackChunkName: "doge-transfer-send-modal" */ './TransferSendModal.vue'),
};

export default protocolViews;
