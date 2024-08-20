import type { ProtocolViewsConfig } from '@/types';

const protocolViews: ProtocolViewsConfig = {
  AccountDetails: () => import(
    /* webpackChunkName: "sol-account-details" */
    './AccountDetails.vue'
  ),
  AccountDetailsTokens: () => import(
    /* webpackChunkName: "sol-account-details" */
    './AccountDetailsTokens.vue'
  ),
  AccountDetailsNames: null,
  TransactionDetails: null,
  TransferReceiveModal: null,
  TransferSendModal: null,
};

export default protocolViews;
