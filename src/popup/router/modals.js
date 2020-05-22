import { registerModal } from '../../store/plugins/modals';
import Default from './components/Modals/Default';
import ClaimSuccess from './components/Modals/ClaimSuccess';
import TipUrlStatus from './components/Modals/TipUrlStatus';
import ConfirmTip from './components/Modals/ConfirmTip';
import Confirm from './components/Modals/Confirm';
import ErrorLog from './components/Modals/ErrorLog';
import ConfirmTransactionSign from './components/Modals/ConfirmTransactionSign';

export default async () => {
  registerModal({ name: 'default', component: Default });
  registerModal({ name: 'claim-success', component: ClaimSuccess });
  registerModal({ name: 'tip-url-status', component: TipUrlStatus });
  registerModal({ name: 'confirm-tip', component: ConfirmTip });
  registerModal({ name: 'confirm', component: Confirm });
  registerModal({ name: 'error-log', component: ErrorLog });
  registerModal({ name: 'confirm-transaction-sign', component: ConfirmTransactionSign });
};
