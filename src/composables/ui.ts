import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue';
import { RouteLocationRaw } from 'vue-router';
import { STORAGE_KEYS } from '@/constants';
import { ROUTE_ACCOUNT } from '@/popup/router/routeNames';
import migrateHiddenCardsVuexToComposable from '@/migrations/004-hidden-cards-vuex-to-composables';
import migrateOtherSettingsVuexToComposable from '@/migrations/005-other-settings-vuex-to-composables';
import { useStorageRef } from './storageRef';

export interface IOtherSettings {
  isSeedBackedUp?: boolean;
  saveErrorLog?: boolean;
}

export interface ISecureLoginSettings {
  isEnabled?: boolean;
  timeout?: number;
}

const homeRouteName = ref(ROUTE_ACCOUNT);
const isAppActive = ref(false);
const isLoaderVisible = ref(false);
const loginTargetLocation = ref<RouteLocationRaw>({ name: ROUTE_ACCOUNT });
const qrScannerOpen = ref(false);

const hiddenCards = useStorageRef<string[]>(
  [],
  STORAGE_KEYS.hiddenCards,
  {
    migrations: [
      migrateHiddenCardsVuexToComposable,
    ],
  },
);
const secureLogin = useStorageRef<ISecureLoginSettings>(
  {},
  STORAGE_KEYS.secureLogin,
);
const otherSettings = useStorageRef<IOtherSettings>(
  {},
  STORAGE_KEYS.otherSettings,
  {
    migrations: [
      migrateOtherSettingsVuexToComposable,
    ],
  },
);

const isSeedBackedUp = computed(() => !!otherSettings.value.isSeedBackedUp);
const saveErrorLog = computed(() => !!otherSettings.value.saveErrorLog);
const isSecureLoginEnabled = computed(() => !!secureLogin.value.isEnabled);
const secureLoginTimeout = computed(() => secureLogin.value.timeout ?? 0);

export function useUi() {
  function setHomeRouteName(routeName: string, onChangeCallback?: () => any) {
    if (homeRouteName.value !== routeName) {
      homeRouteName.value = routeName;
      if (onChangeCallback) {
        onChangeCallback();
      }
    }
  }

  function setLoaderVisible(show: boolean) {
    isLoaderVisible.value = show;
  }

  function setLoginTargetLocation(location: RouteLocationRaw) {
    loginTargetLocation.value = location;
  }

  function setQrScanner(open: boolean) {
    qrScannerOpen.value = open;
  }

  function handleVisibilityChange() {
    isAppActive.value = !document.hidden;
  }

  function setCardHidden(cardId: string) {
    hiddenCards.value.push(cardId);
  }

  function setBackedUpSeed(val: boolean) {
    otherSettings.value.isSeedBackedUp = val;
  }

  function setSaveErrorLog(val: boolean) {
    otherSettings.value.saveErrorLog = val;
  }

  function setSecureLoginEnabled(val: boolean) {
    secureLogin.value.isEnabled = val;
  }

  function setSecureLoginTimeout(val: number) {
    secureLogin.value.timeout = val;
  }

  function initVisibilityListeners() {
    handleVisibilityChange();
    onMounted(() => {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    });

    onBeforeUnmount(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    });
  }

  function resetUiSettings() {
    hiddenCards.value = [];
    secureLogin.value = {};
    otherSettings.value = {};
  }

  return {
    homeRouteName,
    hiddenCards,
    isAppActive,
    loginTargetLocation,
    qrScannerOpen,
    isLoaderVisible,
    isSeedBackedUp,
    saveErrorLog,
    isSecureLoginEnabled,
    secureLoginTimeout,
    initVisibilityListeners,
    setCardHidden,
    setBackedUpSeed,
    setSaveErrorLog,
    setHomeRouteName,
    setLoginTargetLocation,
    setQrScanner,
    setLoaderVisible,
    resetUiSettings,
    setSecureLoginEnabled,
    setSecureLoginTimeout,
  };
}
