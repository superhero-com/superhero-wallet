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
  MODAL_NAME_CLAIM_INFO,
  MODAL_NAME_EXTEND_CONFIRM,
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
import { defineAsyncComponent } from 'vue';
import { useModals } from '@/composables';

// Kept as static imports: MODAL_DEFAULT/MODAL_CONFIRM (used everywhere, must
// feel instant), the auth modals (login hot path), and every modal flagged
// `showInPopupIfWebFrame` below (they render as a real popup window a
// connected dapp is actively waiting on, so a chunk-load delay is user-visible
// at the worst possible moment). ProtocolSpecificView already resolves its
// real content via `defineAsyncComponent` internally, so importing the thin
// wrapper eagerly costs nothing. Everything else is wrapped in
// `defineAsyncComponent(() => import(...))` so it only downloads when opened.
import Default from '@/popup/components/Modals/Default.vue';
import ProtocolSpecificView from '@/popup/components/ProtocolSpecificView.vue';
import Confirm from '@/popup/components/Modals/Confirm.vue';
import ConfirmConnect from '@/popup/pages/Popups/Connect.vue';
import ConfirmAccountList from '@/popup/pages/Popups/AccountList.vue';
import ConfirmTransactionSign from '@/popup/components/Modals/ConfirmTransactionSign.vue';
import ConfirmRawSign from '@/popup/components/Modals/ConfirmRawSign.vue';
import ConfirmUnsafeSign from '@/popup/components/Modals/ConfirmUnsafeSign.vue';
import MessageSign from '@/popup/pages/Popups/MessageSign.vue';
import ClaimGiftCard from '@/popup/components/Modals/ClaimGiftCard.vue';
import ConfirmDisableErrorLog from '@/popup/components/Modals/ConfirmDisableErrorLog.vue';
import BiometricLogin from '@/popup/components/Modals/BiometricLogin.vue';
import EnableBiometricLogin from '@/popup/components/Modals/EnableBiometricLogin.vue';
import SetPassword from '@/popup/components/Modals/SetPassword.vue';
import PasswordLogin from '@/popup/components/Modals/PasswordLogin.vue';

const NetworkSwitcherModal = defineAsyncComponent(() => import('@/popup/components/Modals/NetworkSwitcherModal.vue'));
const AccountCreate = defineAsyncComponent(() => import('@/popup/components/Modals/AccountCreate.vue'));
const ProtocolSelect = defineAsyncComponent(() => import('@/popup/components/Modals/ProtocolSelect.vue'));
const AccountImport = defineAsyncComponent(() => import('@/popup/components/Modals/AccountImport.vue'));
const AccountSelectOptions = defineAsyncComponent(() => import('@/popup/components/Modals/AccountSelectOptions.vue'));
const ClaimSuccess = defineAsyncComponent(() => import('@/popup/components/Modals/ClaimSuccess.vue'));
const ErrorLog = defineAsyncComponent(() => import('@/popup/components/Modals/ErrorLog.vue'));
const PrivateKeyExport = defineAsyncComponent(() => import('@/popup/components/Modals/PrivateKeyExport.vue'));
const FormSelectOptions = defineAsyncComponent(() => import('@/popup/components/Modals/FormSelectOptions.vue'));
const QrCodeScanner = defineAsyncComponent(() => import('@/popup/components/Modals/QrCodeScanner.vue'));
const Help = defineAsyncComponent(() => import('@/popup/components/Modals/Help.vue'));
const AssetSelector = defineAsyncComponent(() => import('@/popup/components/Modals/AssetSelector.vue'));
const ResetWallet = defineAsyncComponent(() => import('@/popup/components/Modals/ResetWalletModal.vue'));
const RecipientInfo = defineAsyncComponent(() => import('@/popup/components/Modals/RecipientInfo.vue'));
const ConsensusInfo = defineAsyncComponent(() => import('@/popup/components/Modals/ConsensusInfo.vue'));
const PayloadForm = defineAsyncComponent(() => import('@/popup/components/Modals/PayloadForm.vue'));
const MultisigVaultCreate = defineAsyncComponent(() => import('@/popup/components/Modals/MultisigVaultCreate.vue'));
const WarningDappBrowser = defineAsyncComponent(() => import('@/popup/components/Modals/WarningDappBrowser.vue'));
const MultisigProposalConfirmActions = defineAsyncComponent(
  () => import('@/popup/components/Modals/MultisigProposalConfirmActions.vue'),
);
const BrowserActions = defineAsyncComponent(() => import('@/popup/components/Modals/BrowserActions.vue'));
const WalletConnect = defineAsyncComponent(() => import('@/popup/components/Modals/WalletConnectModal.vue'));
const AirGapImportAccounts = defineAsyncComponent(() => import('@/popup/components/Modals/AirGapImportAccounts.vue'));
const LedgerImportAccounts = defineAsyncComponent(() => import('@/popup/components/Modals/LedgerImportAccounts.vue'));
const LedgerSign = defineAsyncComponent(() => import('@/popup/pages/Popups/LedgerSign.vue'));
const SignAirGapTransaction = defineAsyncComponent(
  () => import('@/popup/components/Modals/SignAirGapTransaction.vue'),
);
const AddressBookImport = defineAsyncComponent(() => import('@/popup/components/Modals/AddressBookImport.vue'));
const ShareAddress = defineAsyncComponent(() => import('@/popup/components/ShareAddress.vue'));
const AddressBookAccountSelector = defineAsyncComponent(
  () => import('@/popup/components/Modals/AddressBookAccountSelector.vue'),
);
const PrivateKeyImport = defineAsyncComponent(() => import('@/popup/components/Modals/PrivateKeyImport.vue'));
const PermissionManager = defineAsyncComponent(() => import('@/popup/components/Modals/PermissionManager.vue'));
const NameClaimInfo = defineAsyncComponent(() => import('@/popup/components/Modals/NameClaimInfo.vue'));
const NameExtendConfirm = defineAsyncComponent(() => import('@/popup/components/Modals/NameExtendConfirm.vue'));

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
  registerModal(MODAL_NAME_CLAIM_INFO, {
    component: NameClaimInfo,
  });
  registerModal(MODAL_NAME_EXTEND_CONFIRM, {
    component: NameExtendConfirm,
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
