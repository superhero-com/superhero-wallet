import { registerModal } from '../../store/plugins/modals';
import DefaultModal from './components/Modals/DefaultModal';
import ClaimSuccessModal from './components/Modals/ClaimSuccessModal';
import TipBadgeModal from './components/Modals/TipBadgeModal';
import ConfirmTip from './components/Modals/ConfirmTip';
import ConfirmModal from './components/Modals/ConfirmModal';

export default async () => {
  registerModal({ name: 'default', component: DefaultModal });
  registerModal({ name: 'claim-success', component: ClaimSuccessModal });
  registerModal({ name: 'tip-badge', component: TipBadgeModal });
  registerModal({ name: 'confirm-tip', component: ConfirmTip });
  registerModal({ name: 'confirm', component: ConfirmModal });
};
