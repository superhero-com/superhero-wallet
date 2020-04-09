import { registerModal } from '../../store/plugins/modals';
import DefaultModal from './components/Modals/DefaultModal';
import TipVerifiedModal from './components/Modals/TipVerifiedModal';
import ClaimSuccessModal from './components/Modals/ClaimSuccessModal';

export default async () => {
  registerModal({ name: 'default', component: DefaultModal });
  registerModal({ name: 'tip-verified', component: TipVerifiedModal });
  registerModal({ name: 'claim-success', component: ClaimSuccessModal });
};
