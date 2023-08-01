import {
  MODAL_ACCOUNT_CREATE,
  MODAL_AE_ACCOUNT_CREATE,
  MODAL_ACCOUNT_IMPORT,
  MODAL_ACCOUNT_SELECT_OPTIONS,
  MODAL_ASSET_SELECTOR,
  MODAL_CLAIM_SUCCESS,
  MODAL_CONFIRM,
  MODAL_CONFIRM_ACCOUNT_LIST,
  MODAL_CONFIRM_CONNECT,
  MODAL_CONFIRM_RAW_SIGN,
  MODAL_CONFIRM_TRANSACTION_SIGN,
  MODAL_CONSENSUS_INFO,
  MODAL_DEFAULT,
  MODAL_ERROR_LOG,
  MODAL_FORM_SELECT_OPTIONS,
  MODAL_HELP,
  MODAL_MESSAGE_SIGN,
  MODAL_MULTISIG_PROPOSAL_CONFIRM_ACTION,
  MODAL_MULTISIG_VAULT_CREATE,
  MODAL_NETWORK_SWITCHER,
  MODAL_PAYLOAD_FORM,
  MODAL_READ_QR_CODE,
  MODAL_RECIPIENT_HELPER,
  MODAL_RECIPIENT_INFO,
  MODAL_RESET_WALLET,
  MODAL_TRANSFER_RECEIVE,
  MODAL_TRANSFER_SEND,
  PROTOCOL_VIEW_TRANSFER_RECEIVE,
  PROTOCOL_VIEW_TRANSFER_SEND,
  MODAL_BOWSER_ACTIONS_DAPP,
  MODAL_WARNING_DAPP_BROWSER,
} from '@/constants';
import { useModals } from '@/composables';

import AeternityAccountCreate from '@/protocols/aeternity/views/AccountCreateModal.vue';
import NetworkSwitcherModal from '@/popup/components/Modals/NetworkSwitcherModal.vue';

import Default from '../components/Modals/Default.vue';
import ProtocolSpecificView from '../components/ProtocolSpecificView.vue';
import AccountCreate from '../components/Modals/AccountCreate.vue';
import AccountImport from '../components/Modals/AccountImport.vue';
import AccountSelectOptions from '../components/Modals/AccountSelectOptions.vue';
import ClaimSuccess from '../components/Modals/ClaimSuccess.vue';
import Confirm from '../components/Modals/Confirm.vue';
import ConfirmConnect from '../pages/Popups/Connect.vue';

import ErrorLog from '../components/Modals/ErrorLog.vue';
import FormSelectOptions from '../components/Modals/FormSelectOptions.vue';
import ConfirmTransactionSign from '../components/Modals/ConfirmTransactionSign.vue';
import ConfirmRawSign from '../components/Modals/ConfirmRawSign.vue';
import QrCodeReader from '../components/Modals/QrCodeReader.vue';
import Help from '../components/Modals/Help.vue';
import AssetSelector from '../components/Modals/AssetSelector.vue';
import ResetWallet from '../components/Modals/ResetWallet.vue';
import RecipientHelper from '../components/Modals/RecipientHelper.vue';
import RecipientInfo from '../components/Modals/RecipientInfo.vue';
import ConsensusInfo from '../components/Modals/ConsensusInfo.vue';
import PayloadForm from '../components/Modals/PayloadForm.vue';
import MultisigVaultCreate from '../components/Modals/MultisigVaultCreate.vue';
import WarningDappBrowser from '../components/Modals/WarningDappBrowser.vue';
import MultisigProposalConfirmActions from '../components/Modals/MultisigProposalConfirmActions.vue';
import MessageSign from '../pages/Popups/MessageSign.vue';
import BrowserActions from '../components/Modals/BrowserActions.vue';

export default () => {
  const { registerModal } = useModals();

  registerModal(MODAL_DEFAULT, {
    component: Default,
  });
  registerModal(MODAL_ACCOUNT_CREATE, {
    component: AccountCreate,
  });
  registerModal(MODAL_ACCOUNT_IMPORT, {
    component: AccountImport,
  });
  registerModal(MODAL_CLAIM_SUCCESS, {
    component: ClaimSuccess,
  });
  registerModal(MODAL_CONFIRM, {
    component: Confirm,
  });
  registerModal(MODAL_ERROR_LOG, {
    component: ErrorLog,
  });
  registerModal(MODAL_FORM_SELECT_OPTIONS, {
    component: FormSelectOptions,
  });
  registerModal(MODAL_ACCOUNT_SELECT_OPTIONS, {
    component: AccountSelectOptions,
  });
  registerModal(MODAL_HELP, {
    component: Help,
  });
  registerModal(MODAL_CONFIRM_TRANSACTION_SIGN, {
    component: ConfirmTransactionSign,
    showInPopupIfWebFrame: true,
  });
  registerModal(MODAL_CONFIRM_RAW_SIGN, {
    component: ConfirmRawSign,
    showInPopupIfWebFrame: true,
  });
  registerModal(MODAL_CONFIRM_CONNECT, {
    component: ConfirmConnect,
    showInPopupIfWebFrame: true,
  });
  registerModal(MODAL_CONFIRM_ACCOUNT_LIST, {
    showInPopupIfWebFrame: true,
  });
  registerModal(MODAL_MESSAGE_SIGN, {
    component: MessageSign,
    showInPopupIfWebFrame: true,
  });
  registerModal(MODAL_READ_QR_CODE, {
    component: QrCodeReader,
  });
  registerModal(MODAL_TRANSFER_RECEIVE, {
    component: ProtocolSpecificView,
    viewComponentName: PROTOCOL_VIEW_TRANSFER_RECEIVE,
  });
  registerModal(MODAL_TRANSFER_SEND, {
    component: ProtocolSpecificView,
    viewComponentName: PROTOCOL_VIEW_TRANSFER_SEND,
  });
  registerModal(MODAL_ASSET_SELECTOR, {
    component: AssetSelector,
  });
  registerModal(MODAL_RESET_WALLET, {
    component: ResetWallet,
  });
  registerModal(MODAL_RECIPIENT_HELPER, {
    component: RecipientHelper,
  });
  registerModal(MODAL_RECIPIENT_INFO, {
    component: RecipientInfo,
  });
  registerModal(MODAL_CONSENSUS_INFO, {
    component: ConsensusInfo,
  });
  registerModal(MODAL_PAYLOAD_FORM, {
    component: PayloadForm,
  });
  registerModal(MODAL_MULTISIG_VAULT_CREATE, {
    component: MultisigVaultCreate,
  });
  registerModal(MODAL_MULTISIG_PROPOSAL_CONFIRM_ACTION, {
    component: MultisigProposalConfirmActions,
  });
  registerModal(MODAL_NETWORK_SWITCHER, {
    component: NetworkSwitcherModal,
  });
  registerModal(MODAL_AE_ACCOUNT_CREATE, {
    component: AeternityAccountCreate,
  });
  registerModal(MODAL_BOWSER_ACTIONS_DAPP, {
    component: BrowserActions,
  });
  registerModal(MODAL_WARNING_DAPP_BROWSER, {
    component: WarningDappBrowser,
  });
};
