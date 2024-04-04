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

/** Control the route that would be visible after opening the extension. */
const homeRouteName = ref(ROUTE_ACCOUNT);

/** Defines if user is using the app. Equals `false` when the app browser tab is inactive. */
const isAppActive = ref(false);

/** Control global loader animation put above all other layers. */
const isLoaderVisible = ref(false);

/** Control layer, that allows to close full-screen camera view on mobile devices. */
const isMobileQrScannerVisible = ref(false);

const loginTargetLocation = ref<RouteLocationRaw>({ name: ROUTE_ACCOUNT });

const hiddenCards = useStorageRef<string[]>(
  [],
  STORAGE_KEYS.hiddenCards,
  {
    migrations: [
      migrateHiddenCardsVuexToComposable,
    ],
  },
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

  function setMobileQrScannerVisible(open: boolean) {
    document.querySelector('body')?.classList[(open) ? 'add' : 'remove']('scanner-active');
    isMobileQrScannerVisible.value = open;
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
    otherSettings.value = {};
  }

  return {
    homeRouteName,
    hiddenCards,
    isAppActive,
    loginTargetLocation,
    isMobileQrScannerVisible,
    isLoaderVisible,
    isSeedBackedUp,
    saveErrorLog,
    initVisibilityListeners,
    setCardHidden,
    setBackedUpSeed,
    setSaveErrorLog,
    setHomeRouteName,
    setLoginTargetLocation,
    setMobileQrScannerVisible,
    setLoaderVisible,
    resetUiSettings,
  };
}
