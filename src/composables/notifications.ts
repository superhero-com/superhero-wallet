import { computed, ref, watch } from 'vue';
import type {
  IDefaultComposableOptions,
  INotification,
  INotificationSettings,
  NotificationStatus,
  NotificationType,
} from '@/types';
import {
  fetchJson,
  handleUnknownError,
  postJson,
} from '@/utils';
import {
  NOTIFICATION_STATUS_CREATED,
  NOTIFICATION_STATUS_READ,
  NOTIFICATION_ENTITY_TYPE_TIP,
  AGGREGATOR_URL,
  PROTOCOL_AETERNITY,
  STORAGE_KEYS,
  NOTIFICATION_TYPES,
} from '@/constants';
import migrateNotificationsSettingsVuexToComposable from '@/migrations/007-notifications-settings-vuex-to-composable';
import { useAeNetworkSettings } from '@/protocols/aeternity/composables';
import { useAccounts } from './accounts';
import { createPollingBasedOnMountedComponents } from './composablesHelpers';
import { useAeSdk } from './aeSdk';
import { useStorageRef } from './storageRef';

export interface UseNotificationsOptions extends IDefaultComposableOptions {
  requirePolling?: boolean
}

const POLLING_INTERVAL = 30000;
const FETCHED_NOTIFICATIONS_LIMIT = 20;

const initPollingWatcher = createPollingBasedOnMountedComponents(POLLING_INTERVAL);

const notificationsSettings = useStorageRef<Partial<INotificationSettings>>(
  {},
  STORAGE_KEYS.notificationsSettings,
  {
    migrations: [
      migrateNotificationsSettingsVuexToComposable,
    ],
  },
);
const notificationsSuperhero = ref<INotification[]>([]);
const notificationsWallet = ref<INotification[]>([]);

export function useNotifications({
  requirePolling = false,
  store,
}: UseNotificationsOptions) {
  const { aeActiveNetworkSettings } = useAeNetworkSettings();
  const { fetchRespondChallenge } = useAeSdk({ store });
  const { activeAccount } = useAccounts();

  const canLoadMore = ref(true);
  const fetchedNotificationsOffset = ref(0);

  /**
   * If user don't have the setting explicitly set to false we assume it's true (checked).
   */
  function isNotificationTypeAllowed(type: NotificationType): boolean {
    return [undefined, true].includes(notificationsSettings.value[type]);
  }

  const notificationsAll = computed<INotification[]>(
    () => [...notificationsSuperhero.value, ...notificationsWallet.value]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  );

  /**
   * List of notifications that user allowed to display.
   */
  const notificationsAllowed = computed<INotification[]>(
    () => notificationsAll.value.filter(({ type }) => isNotificationTypeAllowed(type)),
  );

  const notificationsRead = computed(
    () => notificationsAllowed.value.filter(({ status }) => status === NOTIFICATION_STATUS_READ),
  );

  const notificationsNew = computed(
    () => notificationsAllowed.value.filter(({ status }) => status === NOTIFICATION_STATUS_CREATED),
  );

  const notificationsToShow = computed<INotification[]>(
    () => notificationsAllowed.value
      .slice(0, fetchedNotificationsOffset.value * FETCHED_NOTIFICATIONS_LIMIT),
  );

  async function fetchAllNotifications(): Promise<INotification[]> {
    // TODO: Remove this condition once global filter is ready
    if (activeAccount.value.protocol !== PROTOCOL_AETERNITY) {
      return [];
    }

    try {
      const fetchUrl = `${aeActiveNetworkSettings.value.backendUrl}/notification/user/${activeAccount.value.address}`;
      const responseChallenge = await fetchJson(fetchUrl);
      const respondChallenge = await fetchRespondChallenge(responseChallenge);
      const url = new URL(fetchUrl);
      Object.entries(respondChallenge).forEach(
        ([key, value]) => url.searchParams.append(key, value),
      );
      const result = await fetchJson(url.toString());
      return !result || result.err ? [] : result;
    } catch (e) {
      handleUnknownError(e);
      return [];
    }
  }

  async function modifyNotifications(
    ids: number[],
    status: NotificationStatus,
  ) {
    if (!ids.length) {
      return;
    }
    const postToNotificationApi = async (body: any) => postJson(`${aeActiveNetworkSettings.value.backendUrl}/notification`, { body });
    const responseChallenge = await postToNotificationApi({
      ids,
      status,
      author: activeAccount.value.address,
    });
    const respondChallenge = await fetchRespondChallenge(responseChallenge);
    await postToNotificationApi(respondChallenge);
  }

  function addWalletNotification(payload: Partial<INotification>) {
    notificationsWallet.value.push({
      ...payload,
      type: NOTIFICATION_TYPES.wallet,
      status: NOTIFICATION_STATUS_CREATED,
      createdAt: new Date().toISOString(),
    });
  }

  function setWalletNotificationsStatus(createdAt: string, status: NotificationStatus) {
    const currentNotification = notificationsWallet.value.find(
      (notification) => notification.createdAt === createdAt,
    );
    if (currentNotification) {
      currentNotification.status = status;
    }
  }

  function loadMoreNotifications() {
    canLoadMore.value = false;
    fetchedNotificationsOffset.value += 1;
    if (notificationsToShow.value.length < notificationsRead.value.length) {
      canLoadMore.value = true;
    }
  }

  async function markAsReadSuperhero() {
    const status = NOTIFICATION_STATUS_READ;

    const unreadNotificationsIds = notificationsSuperhero.value
      .filter((notification) => notification.status !== status)
      .map((notification) => notification.id!);

    notificationsSuperhero.value = notificationsSuperhero.value.map((notification) => ({
      ...notification,
      status,
    }));

    await modifyNotifications(unreadNotificationsIds, status);
  }

  function markAsReadWallet() {
    notificationsWallet.value.forEach((notification) => {
      if (notification.type === NOTIFICATION_TYPES.wallet) {
        setWalletNotificationsStatus(
          notification.createdAt,
          NOTIFICATION_STATUS_READ,
        );
      }
    });
  }

  function markAsReadAll() {
    markAsReadWallet();
    markAsReadSuperhero();
  }

  function removeIsSeedBackedUpNotification() {
    notificationsWallet.value = notificationsWallet.value
      .filter(({ isSeedBackup }) => !isSeedBackup);
  }

  function toggleNotificationsSetting(type: NotificationType) {
    notificationsSettings.value[type] = !isNotificationTypeAllowed(type);
  }

  if (requirePolling) {
    watch(() => notificationsRead.value, () => {
      loadMoreNotifications();
    }, { deep: true });

    initPollingWatcher(async () => {
      notificationsSuperhero.value = (await fetchAllNotifications())
        .map(({
          entityId,
          sourceId,
          entityType,
          ...other
        }) => ({
          sourceId,
          entityId,
          entityType,
          ...other,
          path: (entityType === NOTIFICATION_ENTITY_TYPE_TIP)
            ? `${AGGREGATOR_URL}tip/${entityId}`
            : `${AGGREGATOR_URL}tip/${sourceId}/comment/${entityId}`,
        }));
    });
  }

  return {
    notificationsAll,
    notificationsAllowed,
    notificationsRead,
    notificationsNew,
    notificationsToShow,
    notificationsSuperhero,
    notificationsWallet,
    notificationsSettings,
    canLoadMore,
    loadMoreNotifications,
    markAsReadAll,
    addWalletNotification,
    removeIsSeedBackedUpNotification,
    toggleNotificationsSetting,
    isNotificationTypeAllowed,
  };
}
