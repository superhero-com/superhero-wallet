import { registerModal } from '../../store/plugins/modals';

import {
  MODAL_DEFAULT,
  MODAL_ACCOUNT_CREATE,
  MODAL_ACCOUNT_IMPORT,
  MODAL_ASSET_SELECTOR,
  MODAL_CLAIM_SUCCESS,
  MODAL_SPEND_SUCCESS,
  MODAL_CONFIRM,
  MODAL_CONFIRM_TRANSACTION_SIGN,
  MODAL_CONFIRM_RAW_SIGN,
  MODAL_CONFIRM_CONNECT,
  MODAL_ERROR_LOG,
  MODAL_FORM_SELECT_OPTIONS,
  MODAL_HELP,
  MODAL_READ_QR_CODE,
  MODAL_MESSAGE_SIGN,
  MODAL_TRANSFER_RECEIVE,
  MODAL_RESET_WALLET,
  MODAL_TRANSFER_SEND,
  MODAL_RECIPIENT_INFO,
  MODAL_RECIPIENT_HELPER,
  MODAL_PAYLOAD_FORM,
  MODAL_MULTISIG_VAULT_CREATE,
  MODAL_MULTISIG_PROPOSAL_CONFIRM_ACTION,
  MODAL_AIR_GAP_CONFIRM_IMPORT,
  MODAL_AIR_GAP_TRANSACTION_QR,
} from '../utils/constants';

import Default from '../components/Modals/Default.vue';
import AccountCreate from '../components/Modals/AccountCreate.vue';
import AccountImport from '../components/Modals/AccountImport.vue';
import AirGapConfirmImport from '../components/Modals/AirGapConfirmImport.vue';
import TransactionQR from '../components/Modals/AirGap/TransactionQR.vue';
import ClaimSuccess from '../components/Modals/ClaimSuccess.vue';
import SpendSuccess from '../components/Modals/SpendSuccess.vue';
import Confirm from '../components/Modals/Confirm.vue';
import ErrorLog from '../components/Modals/ErrorLog.vue';
import FormSelectOptions from '../components/Modals/FormSelectOptions.vue';
import ConfirmTransactionSign from '../components/Modals/ConfirmTransactionSign.vue';
import ConfirmRawSign from '../components/Modals/ConfirmRawSign.vue';
import QrCodeReader from '../components/Modals/QrCodeReader.vue';
import Help from '../components/Modals/Help.vue';
import AssetSelector from '../components/Modals/AssetSelector.vue';
import TransferReceive from '../components/Modals/TransferReceive.vue';
import ResetWallet from '../components/Modals/ResetWallet.vue';
import TransferSend from '../components/Modals/TransferSend.vue';
import RecipientHelper from '../components/Modals/RecipientHelper.vue';
import RecipientInfo from '../components/Modals/RecipientInfo.vue';
import PayloadForm from '../components/Modals/PayloadForm.vue';
import MultisigVaultCreate from '../components/Modals/MultisigVaultCreate.vue';
import MultisigProposalConfirmActions from '../components/Modals/MultisigProposalConfirmActions.vue';

export default () => {
  registerModal({ name: MODAL_DEFAULT, component: Default });
  registerModal({ name: MODAL_ACCOUNT_CREATE, component: AccountCreate });
  registerModal({ name: MODAL_ACCOUNT_IMPORT, component: AccountImport });
  registerModal({ name: MODAL_AIR_GAP_CONFIRM_IMPORT, component: AirGapConfirmImport });
  registerModal({ name: MODAL_AIR_GAP_TRANSACTION_QR, component: TransactionQR });
  registerModal({ name: MODAL_CLAIM_SUCCESS, component: ClaimSuccess });
  registerModal({ name: MODAL_SPEND_SUCCESS, component: SpendSuccess });
  registerModal({ name: MODAL_CONFIRM, component: Confirm });
  registerModal({ name: MODAL_ERROR_LOG, component: ErrorLog });
  registerModal({ name: MODAL_FORM_SELECT_OPTIONS, component: FormSelectOptions });
  registerModal({ name: MODAL_HELP, component: Help });
  registerModal({
    name: MODAL_CONFIRM_TRANSACTION_SIGN,
    component: ConfirmTransactionSign,
    showInPopupIfWebFrame: true,
  });
  registerModal({
    name: MODAL_CONFIRM_RAW_SIGN,
    component: ConfirmRawSign,
    showInPopupIfWebFrame: true,
  });
  registerModal({ name: MODAL_CONFIRM_CONNECT, showInPopupIfWebFrame: true });
  registerModal({ name: MODAL_READ_QR_CODE, component: QrCodeReader });
  registerModal({ name: MODAL_MESSAGE_SIGN, showInPopupIfWebFrame: true });
  registerModal({ name: MODAL_TRANSFER_RECEIVE, component: TransferReceive });
  registerModal({ name: MODAL_TRANSFER_SEND, component: TransferSend });
  registerModal({ name: MODAL_ASSET_SELECTOR, component: AssetSelector });
  registerModal({ name: MODAL_RESET_WALLET, component: ResetWallet });
  registerModal({ name: MODAL_RECIPIENT_HELPER, component: RecipientHelper });
  registerModal({ name: MODAL_RECIPIENT_INFO, component: RecipientInfo });
  registerModal({ name: MODAL_PAYLOAD_FORM, component: PayloadForm });
  registerModal({ name: MODAL_MULTISIG_VAULT_CREATE, component: MultisigVaultCreate });
  registerModal({
    name: MODAL_MULTISIG_PROPOSAL_CONFIRM_ACTION,
    component: MultisigProposalConfirmActions,
  });
};
