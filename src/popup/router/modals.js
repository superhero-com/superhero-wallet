import { registerModal } from '../../store/plugins/modals';
import Default from './components/Modals/Default';
import ClaimSuccess from './components/Modals/ClaimSuccess';
import TipUrlStatus from './components/Modals/TipUrlStatus';
import ConfirmTip from './components/Modals/ConfirmTip';
import Confirm from './components/Modals/Confirm';
import ErrorLog from './components/Modals/ErrorLog';
import ConfirmTransactionSign from './components/Modals/ConfirmTransactionSign';
import ConfirmRawSign from './components/Modals/ConfirmRawSign';
import QrCodeReader from './components/Modals/QrCodeReader';

export default () => {
  registerModal({ name: 'default', component: Default });
  registerModal({ name: 'claim-success', component: ClaimSuccess });
  registerModal({ name: 'tip-url-status', component: TipUrlStatus });
  registerModal({ name: 'confirm-tip', component: ConfirmTip });
  registerModal({ name: 'confirm', component: Confirm });
  registerModal({ name: 'error-log', component: ErrorLog });
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
};
