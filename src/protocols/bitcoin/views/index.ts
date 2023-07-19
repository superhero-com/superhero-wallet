import type { ProtocolViewsConfig } from '@/types';

const protocolViews: ProtocolViewsConfig = {
  AccountDetails: () => import(
    /* webpackChunkName: "btc-account-details" */
    './AccountDetails.vue'
  ),
  TransferReceiveModal: () => import(
    /* webpackChunkName: "btc-transfer-receive-modal" */
    './TransferReceiveModal.vue'
  ),
};

export default protocolViews;
