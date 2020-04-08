import { registerModal } from '../../store/plugins/modals';
import ClaimModal from './components/Modals/ClaimModal';

export default async () => {
  registerModal({ name: 'claim', component: ClaimModal });
};