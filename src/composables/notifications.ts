import { computed, ref, watch } from 'vue';
import type {
  IDefaultComposableOptions,
  IFilterInputPayload,
  IFilters,
  INetwork,
  INotification,
  NotificationStatus,
  ObjectValues,
} from '../types';
import {
  NOTIFICATION_STATUS_CREATED,
  NOTIFICATION_STATUS_READ,
  NOTIFICATION_TYPE_WALLET,
  NOTIFICATION_ENTITY_TYPE_TIP,
  AGGREGATOR_URL,
  fetchJson,
  postJson,
  fetchRespondChallenge,
} from '../popup/utils';
import { useSdk } from './sdk';
import { useAccounts } from './accounts';
import { createPollingBasedOnMountedComponents } from './composablesHelpers';
import PushNotification from '../lib/PushNotification';
import { i18n } from '../store/plugins/languages';

export interface UseNotificationsOptions extends IDefaultComposableOptions {
  requirePolling?: boolean
}

const POLLING_INTERVAL = 30000;
const FETCHED_NOTIFICATIONS_LIMIT = 20;

const initPollingWatcher = createPollingBasedOnMountedComponents(POLLING_INTERVAL);

const notificationsSuperhero = ref<INotification[]>([]);
const notificationsWallet = ref<INotification[]>([]);

const NOTIFICATION_FILTER_MODE = {
  all: 'all',
  superhero: 'superhero',
  wallet: 'wallet',
} as const;
type NotificationsFilterMode = ObjectValues<typeof NOTIFICATION_FILTER_MODE>;

export function useNotifications({
  requirePolling = false,
  store,
}: UseNotificationsOptions) {
  const { getSdk } = useSdk({ store });
  const { activeAccount } = useAccounts({ store });

  const canLoadMore = ref(true);
  const fetchedNotificationsOffset = ref(0);

  const filtersConfig = ref<IFilters<ObjectValues<typeof NOTIFICATION_FILTER_MODE>>>({
    all: { name: i18n.t('common.all') },
    superhero: { name: i18n.t('filters.superhero') },
    wallet: { name: i18n.t('filters.wallet') },
  });
  const displayMode = ref<IFilterInputPayload<NotificationsFilterMode>>({
    key: NOTIFICATION_FILTER_MODE.all,
  });

  const activeNetwork = computed((): INetwork => store.getters.activeNetwork);
  const chainNames = computed(() => store.state.chainNames);
  const notificationsAll = computed<INotification[]>(
    () => [...notificationsSuperhero.value, ...notificationsWallet.value],
  );

  const notificationsFiltered = computed<INotification[]>(
    () => notificationsAll.value
      .filter(
        ({ type }) => (
          displayMode.value.key === NOTIFICATION_FILTER_MODE.all
          || (
            displayMode.value.key === NOTIFICATION_FILTER_MODE.superhero
            && type !== NOTIFICATION_TYPE_WALLET
          ) || (
            displayMode.value.key === NOTIFICATION_FILTER_MODE.wallet
            && type === NOTIFICATION_TYPE_WALLET
          )
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
    const [responseChallenge, sdk] = await Promise.all([
      fetchJson(fetchUrl),
      getSdk(),
    ]);
    const respondChallenge = await fetchRespondChallenge(sdk, responseChallenge);
    const url = new URL(fetchUrl);
    Object.entries(respondChallenge).forEach(([key, value]) => url.searchParams.append(key, value));
    return await fetchJson(url.toString()) || [];
  }

  async function modifyNotifications(
    ids: (number | string)[],
    status: NotificationStatus,
  ) {
    if (!ids.length) return;
    const backendMethod = async (body: any) => postJson(`${activeNetwork.value.backendUrl}/notification`, { body });
    const [responseChallenge, sdk] = await Promise.all([
      backendMethod({ ids, status, author: activeAccount.value.address }),
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

    if (payload.pushNotification) {
      PushNotification.send(payload);
    }
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
    filtersConfig,
    displayMode,
  };
}
