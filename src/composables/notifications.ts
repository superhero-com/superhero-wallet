import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from '@vue/composition-api';
import {
  IAccount,
  INetwork,
  INotification,
  INotificationSetting,
  NotificationStatus,
} from '../types';
import { useGetter, useState } from './vuex';
import {
  NOTIFICATION_STATUS_CREATED,
  NOTIFICATION_STATUS_READ,
  NOTIFICATION_TYPE_WALLET,
  NOTIFICATION_ENTITY_TYPE_TIP,
  AGGREGATOR_URL,
  executeAndSetInterval,
  fetchJson,
  postJson,
  fetchRespondChallenge,
} from '../popup/utils';
import { useSdk } from './sdk';

export interface UseNotificationsOptions {
  requirePolling?: boolean,
}

const FETCHED_NOTIFICATIONS_LIMIT = 20;

const pollingComponentsCounter = ref<number>(0);
const notificationsSuperhero = ref<INotification[]>([]);
const notificationsWallet = ref<INotification[]>([]);
let pollingIntervalId: NodeJS.Timer | null = null;

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { getSdk } = useSdk();

  const activeNetwork = useGetter<INetwork>('activeNetwork');
  const account = useGetter<IAccount>('account');
  const notificationSettings = useState<INotificationSetting[]>('notificationSettings');
  const chainNames = useState('chainNames');

  const canLoadMore = ref(true);
  const fetchedNotificationsOffset = ref(0);

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
    const fetchUrl = `${activeNetwork.value.backendUrl}/notification/user/${account.value.address}`;
    const [responseChallenge, sdk] = await Promise.all([
      fetchJson(fetchUrl),
      getSdk(),
    ]);
    const respondChallenge = await fetchRespondChallenge(sdk, responseChallenge);
    const url = new URL(fetchUrl);
    Object.entries(respondChallenge).forEach(([key, value]) => url.searchParams.append(key, value));
    return fetchJson(url.toString());
  }

  async function modifyNotifications(
    ids: number[],
    status: NotificationStatus,
  ) {
    if (!ids.length) return;
    const backendMethod = async (body: any) => postJson(`${activeNetwork.value.backendUrl}/notification`, { body });
    const [responseChallenge, sdk] = await Promise.all([
      backendMethod({ ids, status, author: account.value.address }),
      getSdk(),
    ]);
    const respondChallenge = await fetchRespondChallenge(sdk, responseChallenge);
    await backendMethod(respondChallenge);
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

  function stopNotificationsPolling() {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      pollingIntervalId = null;
    }
  }

  function startNotificationsPolling() {
    stopNotificationsPolling();

    pollingIntervalId = executeAndSetInterval(async () => {
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
    }, 30000);
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
    startNotificationsPolling();
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

  if (options.requirePolling) {
    watch(() => notificationsFiltered.value, () => {
      loadMoreNotifications();
    });
  }

  onMounted(async () => {
    if (options.requirePolling) {
      pollingComponentsCounter.value += 1;
    }
    if (pollingComponentsCounter.value > 0 && !pollingIntervalId) {
      startNotificationsPolling();
    }
  });

  onBeforeUnmount(() => {
    if (options.requirePolling) {
      pollingComponentsCounter.value -= 1;
    }
    if (pollingComponentsCounter.value <= 0) {
      stopNotificationsPolling();
    }
  });

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
