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
    qrScannerOpen,
    isLoaderVisible,
    isSeedBackedUp,
    saveErrorLog,
    initVisibilityListeners,
    setCardHidden,
    setBackedUpSeed,
    setSaveErrorLog,
    setHomeRouteName,
    setLoginTargetLocation,
    setQrScanner,
    setLoaderVisible,
    resetUiSettings,
  };
}
