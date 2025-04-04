import {
  MODAL_ACCOUNT_CREATE,
  MODAL_ACCOUNT_IMPORT,
  MODAL_ACCOUNT_SELECT_OPTIONS,
  MODAL_ASSET_SELECTOR,
  MODAL_CLAIM_GIFT_CARD,
  MODAL_CLAIM_SUCCESS,
  MODAL_CONFIRM,
  MODAL_CONFIRM_ACCOUNT_LIST,
  MODAL_CONFIRM_CONNECT,
  MODAL_CONFIRM_RAW_SIGN,
  MODAL_CONFIRM_UNSAFE_SIGN,
  MODAL_CONFIRM_TRANSACTION_SIGN,
  MODAL_CONFIRM_DISABLE_ERROR_LOG,
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
  MODAL_PRIVATE_KEY_EXPORT,
  MODAL_PRIVATE_KEY_IMPORT,
  MODAL_PROTOCOL_SELECT,
  MODAL_SCAN_QR,
  MODAL_RECIPIENT_INFO,
  MODAL_RESET_WALLET,
  MODAL_TRANSFER_RECEIVE,
  MODAL_TRANSFER_SEND,
  MODAL_DAPP_BROWSER_ACTIONS,
  MODAL_WALLET_CONNECT,
  MODAL_WARNING_DAPP_BROWSER,
  MODAL_BIOMETRIC_LOGIN,
  MODAL_ENABLE_BIOMETRIC_LOGIN,
  MODAL_AIR_GAP_IMPORT_ACCOUNTS,
  MODAL_LEDGER_IMPORT_ACCOUNTS,
  MODAL_LEDGER_SIGN,
  MODAL_SIGN_AIR_GAP_TRANSACTION,
  MODAL_ADDRESS_BOOK_IMPORT,
  MODAL_SHARE_ADDRESS,
  MODAL_ADDRESS_BOOK_ACCOUNT_SELECTOR,
  MODAL_SET_PASSWORD,
  MODAL_PASSWORD_LOGIN,
  MODAL_PERMISSION_MANAGER,
  PROTOCOL_VIEW_TRANSFER_RECEIVE,
  PROTOCOL_VIEW_TRANSFER_SEND,
} from '@/constants';
import { useModals } from '@/composables';

import NetworkSwitcherModal from '@/popup/components/Modals/NetworkSwitcherModal.vue';

import ConfirmDisableErrorLog from '@/popup/components/Modals/ConfirmDisableErrorLog.vue';
import AccountCreate from '@/popup/components/Modals/AccountCreate.vue';
import Default from '@/popup/components/Modals/Default.vue';
import ProtocolSpecificView from '@/popup/components/ProtocolSpecificView.vue';
import ProtocolSelect from '@/popup/components/Modals/ProtocolSelect.vue';
import AccountImport from '@/popup/components/Modals/AccountImport.vue';
import AccountSelectOptions from '@/popup/components/Modals/AccountSelectOptions.vue';
import ClaimSuccess from '@/popup/components/Modals/ClaimSuccess.vue';
import Confirm from '@/popup/components/Modals/Confirm.vue';
import ConfirmConnect from '@/popup/pages/Popups/Connect.vue';
import ConfirmAccountList from '@/popup/pages/Popups/AccountList.vue';

import ErrorLog from '@/popup/components/Modals/ErrorLog.vue';
import PrivateKeyExport from '@/popup/components/Modals/PrivateKeyExport.vue';
import FormSelectOptions from '@/popup/components/Modals/FormSelectOptions.vue';
import ConfirmTransactionSign from '@/popup/components/Modals/ConfirmTransactionSign.vue';
import ConfirmRawSign from '@/popup/components/Modals/ConfirmRawSign.vue';
import ConfirmUnsafeSign from '@/popup/components/Modals/ConfirmUnsafeSign.vue';
import QrCodeScanner from '@/popup/components/Modals/QrCodeScanner.vue';
import Help from '@/popup/components/Modals/Help.vue';
import AssetSelector from '@/popup/components/Modals/AssetSelector.vue';
import ResetWallet from '@/popup/components/Modals/ResetWalletModal.vue';
import RecipientInfo from '@/popup/components/Modals/RecipientInfo.vue';
import ConsensusInfo from '@/popup/components/Modals/ConsensusInfo.vue';
import PayloadForm from '@/popup/components/Modals/PayloadForm.vue';
import ClaimGiftCard from '@/popup/components/Modals/ClaimGiftCard.vue';
import MultisigVaultCreate from '@/popup/components/Modals/MultisigVaultCreate.vue';
import WarningDappBrowser from '@/popup/components/Modals/WarningDappBrowser.vue';
import MultisigProposalConfirmActions from '@/popup/components/Modals/MultisigProposalConfirmActions.vue';
import MessageSign from '@/popup/pages/Popups/MessageSign.vue';
import BrowserActions from '@/popup/components/Modals/BrowserActions.vue';
import BiometricLogin from '@/popup/components/Modals/BiometricLogin.vue';
import EnableBiometricLogin from '@/popup/components/Modals/EnableBiometricLogin.vue';
import WalletConnect from '@/popup/components/Modals/WalletConnectModal.vue';
import AirGapImportAccounts from '@/popup/components/Modals/AirGapImportAccounts.vue';
import LedgerImportAccounts from '@/popup/components/Modals/LedgerImportAccounts.vue';
import LedgerSign from '@/popup/pages/Popups/LedgerSign.vue';
import SignAirGapTransaction from '@/popup/components/Modals/SignAirGapTransaction.vue';
import AddressBookImport from '@/popup/components/Modals/AddressBookImport.vue';
import ShareAddress from '@/popup/components/ShareAddress.vue';
import AddressBookAccountSelector from '@/popup/components/Modals/AddressBookAccountSelector.vue';
import SetPassword from '@/popup/components/Modals/SetPassword.vue';
import PasswordLogin from '@/popup/components/Modals/PasswordLogin.vue';
import PrivateKeyImport from '@/popup/components/Modals/PrivateKeyImport.vue';
import PermissionManager from '@/popup/components/Modals/PermissionManager.vue';

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
  registerModal(MODAL_PRIVATE_KEY_IMPORT, {
    component: PrivateKeyImport,
  });
  registerModal(MODAL_AIR_GAP_IMPORT_ACCOUNTS, {
    component: AirGapImportAccounts,
  });
  registerModal(MODAL_LEDGER_IMPORT_ACCOUNTS, {
    component: LedgerImportAccounts,
  });
  registerModal(MODAL_LEDGER_SIGN, {
    component: LedgerSign,
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
  registerModal(MODAL_CLAIM_GIFT_CARD, {
    component: ClaimGiftCard,
    showInPopupIfWebFrame: true,
  });
  registerModal(MODAL_CONFIRM_TRANSACTION_SIGN, {
    component: ConfirmTransactionSign,
    showInPopupIfWebFrame: true,
  });
  registerModal(MODAL_CONFIRM_RAW_SIGN, {
    component: ConfirmRawSign,
    showInPopupIfWebFrame: true,
  });
  registerModal(MODAL_CONFIRM_UNSAFE_SIGN, {
    component: ConfirmUnsafeSign,
    showInPopupIfWebFrame: true,
  });
  registerModal(MODAL_CONFIRM_CONNECT, {
    component: ConfirmConnect,
    showInPopupIfWebFrame: true,
  });
  registerModal(MODAL_CONFIRM_ACCOUNT_LIST, {
    component: ConfirmAccountList,
    showInPopupIfWebFrame: true,
  });
  registerModal(MODAL_CONFIRM_DISABLE_ERROR_LOG, {
    component: ConfirmDisableErrorLog,
    showInPopupIfWebFrame: true,
  });
  registerModal(MODAL_PRIVATE_KEY_EXPORT, {
    component: PrivateKeyExport,
  });
  registerModal(MODAL_MESSAGE_SIGN, {
    component: MessageSign,
    showInPopupIfWebFrame: true,
  });
  registerModal(MODAL_SCAN_QR, {
    component: QrCodeScanner,
  });
  registerModal(MODAL_PROTOCOL_SELECT, {
    component: ProtocolSelect,
  });
  registerModal(MODAL_PERMISSION_MANAGER, {
    component: PermissionManager,
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
  registerModal(MODAL_DAPP_BROWSER_ACTIONS, {
    component: BrowserActions,
  });
  registerModal(MODAL_WALLET_CONNECT, {
    component: WalletConnect,
  });
  registerModal(MODAL_WARNING_DAPP_BROWSER, {
    component: WarningDappBrowser,
  });
  registerModal(MODAL_BIOMETRIC_LOGIN, {
    component: BiometricLogin,
  });
  registerModal(MODAL_ENABLE_BIOMETRIC_LOGIN, {
    component: EnableBiometricLogin,
  });
  registerModal(MODAL_SIGN_AIR_GAP_TRANSACTION, {
    component: SignAirGapTransaction,
  });
  registerModal(MODAL_ADDRESS_BOOK_IMPORT, {
    component: AddressBookImport,
  });
  registerModal(MODAL_SHARE_ADDRESS, {
    component: ShareAddress,
  });
  registerModal(MODAL_ADDRESS_BOOK_ACCOUNT_SELECTOR, {
    component: AddressBookAccountSelector,
  });
  registerModal(MODAL_SET_PASSWORD, {
    component: SetPassword,
  });
  registerModal(MODAL_PASSWORD_LOGIN, {
    component: PasswordLogin,
  });
};
