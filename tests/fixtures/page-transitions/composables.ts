import { ref } from 'vue';

const noop = () => {};

export const useAccounts = () => ({ isLoggedIn: ref(true) });
export const useAuth = () => ({ isAuthenticated: ref(true) });
export const useConnection = () => ({ watchConnectionStatus: noop });
export const useCurrencies = () => ({ loadCoinsData: noop });
export const useInvites = noop;
export const useLanguages = () => ({ restoreLanguage: noop });
export const useModals = () => ({ modalsOpen: ref([]) });
export const useMultisigAccounts = () => ({ multisigAccounts: ref([{}]) });
export const useNotifications = () => ({ addWalletNotification: noop });
export const usePageNavigation = () => ({ navigateBack: noop });
export const useTopHeaderData = () => ({ topBlockHeight: ref(0) });
export const useTransferSendHandler = () => ({ restoreTransferSendForm: noop });
export const useAeNames = () => ({
  claimPreclaimedNames: noop,
  extendExpiringOwnedNames: noop,
});
export const useUi = () => ({
  isSeedBackedUp: ref(true),
  isMobileQrScannerVisible: ref(false),
  isLoaderVisible: ref(false),
  initVisibilityListeners: noop,
  setHomeRouteName: noop,
});
