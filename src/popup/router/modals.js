import { registerModal } from '../../store/plugins/modals';
import Default from './components/Modals/Default.vue';
import ClaimSuccess from './components/Modals/ClaimSuccess.vue';
import SpendSuccess from './components/Modals/SpendSuccess.vue';
import ConfirmTip from './components/Modals/ConfirmTip.vue';
import Confirm from './components/Modals/Confirm.vue';
import ErrorLog from './components/Modals/ErrorLog.vue';
import ConfirmTransactionSign from './components/Modals/ConfirmTransactionSign.vue';
import ConfirmRawSign from './components/Modals/ConfirmRawSign.vue';
import QrCodeReader from './components/Modals/QrCodeReader.vue';
import Help from './components/Modals/Help.vue';
import ShareQr from './components/Modals/ShareQr.vue';
import AccountDetails from './components/Modals/AccountDetails.vue';

export default () => {
  registerModal({ name: 'default', component: Default });
  registerModal({ name: 'claim-success', component: ClaimSuccess });
  registerModal({ name: 'spend-success', component: SpendSuccess });
  registerModal({ name: 'confirm-tip', component: ConfirmTip });
  registerModal({ name: 'confirm', component: Confirm });
  registerModal({ name: 'error-log', component: ErrorLog });
  registerModal({ name: 'help', component: Help });
  registerModal({
    name: 'confirm-transaction-sign',
    component: ConfirmTransactionSign,
    showInPopupIfWebFrame: true,
  });
  registerModal({
    name: 'confirm-raw-sign',
    component: ConfirmRawSign,
    showInPopupIfWebFrame: true,
  });
  registerModal({ name: 'confirm-connect', showInPopupIfWebFrame: true });
  registerModal({ name: 'read-qr-code', component: QrCodeReader });
  registerModal({ name: 'confirm-message-sign', showInPopupIfWebFrame: true });
  registerModal({ name: 'share-qr', component: ShareQr });
  registerModal({ name: 'account-details', component: AccountDetails });
};
