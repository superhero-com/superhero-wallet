import type { ProtocolViewsConfig } from '@/types';

const protocolViews: ProtocolViewsConfig = {
  AccountDetails: () => import(
    /* webpackChunkName: "ae-account-details" */
    './AccountDetails.vue'
  ),
  TransferReceiveModal: () => import(
    /* webpackChunkName: "ae-transfer-receive-modal" */
    './TransferReceiveModal.vue'
  ),
};

export default protocolViews;