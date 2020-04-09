import { registerModal } from '../../store/plugins/modals';
import ClaimModal from './components/Modals/ClaimModal';
import DefaultModal from './components/Modals/DefaultModal';
import TipVerifiedModal from './components/Modals/TipVerifiedModal';
import ClaimSuccessModal from './components/Modals/ClaimSuccessModal';

export default async () => {
  registerModal({ name: 'claim', component: ClaimModal });
  registerModal({ name: 'default', component: DefaultModal });
  registerModal({ name: 'tip-verified', component: TipVerifiedModal });
  registerModal({ name: 'claim-success', component: ClaimSuccessModal });
};