import { computed, ref, watch } from 'vue';
import type {
  IDefaultComposableOptions,
  INetwork,
  INotification,
  INotificationSetting,
  NotificationStatus,
} from '../types';
import {
  NOTIFICATION_STATUS_CREATED,
  NOTIFICATION_STATUS_READ,
  NOTIFICATION_TYPE_WALLET,
  NOTIFICATION_ENTITY_TYPE_TIP,
  AGGREGATOR_URL,
  fetchJson,
  postJson,
} from '../popup/utils';
import { useAccounts } from './accounts';
import { createPollingBasedOnMountedComponents } from './composablesHelpers';
import { useSdk } from './sdk';

export interface UseNotificationsOptions extends IDefaultComposableOptions {
  requirePolling?: boolean
}

const POLLING_INTERVAL = 30000;
const FETCHED_NOTIFICATIONS_LIMIT = 20;

const initPollingWatcher = createPollingBasedOnMountedComponents(POLLING_INTERVAL);

const notificationsSuperhero = ref<INotification[]>([]);
const notificationsWallet = ref<INotification[]>([]);

export function useNotifications({
  requirePolling = false,
  store,
}: UseNotificationsOptions) {
  const { fetchRespondChallenge } = useSdk({ store });
  const { activeAccount } = useAccounts({ store });

  const canLoadMore = ref(true);
  const fetchedNotificationsOffset = ref(0);

  const activeNetwork = computed((): INetwork => store.getters.activeNetwork);
  const notificationSettings = computed(
    (): INotificationSetting[] => store.state.notificationSettings,
  );
  const chainNames = computed(() => store.state.chainNames);

  const notificationSettingsCheckedTypes = computed<string[]>(
    () => notificationSettings.value
      .filter(({ checked }) => checked)
      .map((s) => s.type),
  );

  const notificationsAll = computed<INotification[]>(
    () => [...notificationsSuperhero.value, ...notificationsWallet.value],
  );

  const notificationsFiltered = computed<INotification[]>(
    () => notificationsAll.value
      .filter(
        ({ status, type }) => (
          status === NOTIFICATION_STATUS_READ
          || notificationSettingsCheckedTypes.value.includes(type)
        ),
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  );

  const notificationsToShow = computed<INotification[]>(
    () => notificationsFiltered.value
      .slice(0, fetchedNotificationsOffset.value * FETCHED_NOTIFICATIONS_LIMIT),
  );

  async function fetchAllNotifications(): Promise<INotification[]> {
    const fetchUrl = `${activeNetwork.value.backendUrl}/notification/user/${activeAccount.value.address}`;
    const responseChallenge = await fetchJson(fetchUrl);
    const respondChallenge = await fetchRespondChallenge(responseChallenge);
    const url = new URL(fetchUrl);
    Object.entries(respondChallenge).forEach(([key, value]) => url.searchParams.append(key, value));
    return await fetchJson(url.toString()) || [];
  }

  async function modifyNotifications(
    ids: number[],
    status: NotificationStatus,
  ) {
    if (!ids.length) {
      return;
    }
    const postToNotificationApi = async (body: any) => postJson(`${activeNetwork.value.backendUrl}/notification`, { body });
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
      type: NOTIFICATION_TYPE_WALLET,
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
    if (notificationsToShow.value.length < notificationsFiltered.value.length) {
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
      if (notification.type === NOTIFICATION_TYPE_WALLET) {
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

  if (requirePolling) {
    watch(() => notificationsFiltered.value, () => {
      loadMoreNotifications();
    }, { deep: true });

    initPollingWatcher(async () => {
      notificationsSuperhero.value = (await fetchAllNotifications())
        .map(({
          entityId,
          sourceId,
          entityType,
          sender,
          receiver,
          ...other
        }) => ({
          sourceId,
          entityId,
          entityType,
          ...other,
          sender,
          receiver,
          senderName: sender && chainNames.value?.[sender],
          receiverName: receiver && chainNames.value?.[receiver],
          path: entityType === NOTIFICATION_ENTITY_TYPE_TIP
            ? `${AGGREGATOR_URL}tip/${entityId}`
            : `${AGGREGATOR_URL}tip/${sourceId}/comment/${entityId}`,
        }));
    });
  }

  return {
    notificationsToShow,
    notificationsSuperhero,
    notificationsWallet,
    notificationsAll,
    canLoadMore,
    loadMoreNotifications,
    markAsReadAll,
    addWalletNotification,
  };
}
