import { computed, ref, watch } from 'vue';
import { TranslateResult } from 'vue-i18n';
import { useRoute } from 'vue-router';

import {
  useAccounts,
  useConnection,
  useAeSdk,
  useMultisigAccounts,
} from '@/composables';
import { StatusIconType } from '@/types';
import { ROUTE_ACCOUNT } from '@/popup/router/routeNames';
import { useAeMiddleware, useAeTippingBackend } from '@/protocols/aeternity/composables';
import { isEtherscanUnavailable } from '@/protocols/ethereum/libs/EtherscanService';
import { tg as t } from '@/popup/plugins/i18n';

interface StatusType {
  statusMessage: TranslateResult;
  title?: TranslateResult;
  description?: TranslateResult;
  icon?: StatusIconType;
}

const CONNECTED_DISPLAY_TIME = 2000;

const middlewareUnsynchronizedThreshold = 5;

export function useConnectionStatus() {
  const { isOnline } = useConnection();
  const { isAeNodeConnecting, isAeNodeReady, isAeNodeError } = useAeSdk();
  const { isLoggedIn } = useAccounts();
  const { middlewareStatus, isMiddlewareUnavailable } = useAeMiddleware();
  const { isMultisigBackendUnavailable } = useMultisigAccounts({ pollingDisabled: true });
  const { isBackendUnavailable } = useAeTippingBackend();
  const route = useRoute();

  const justBeenConnected = ref(false);

  const showMultisigError = computed(
    () => route.name === ROUTE_ACCOUNT && isMultisigBackendUnavailable.value,
  );
  const isError = computed(() => !isAeNodeConnecting.value && !justBeenConnected.value);

  // Display "Connected" message for a while after connecting to node.
  watch(isAeNodeReady, (val) => {
    justBeenConnected.value = val;
    if (val) {
      setTimeout(() => {
        justBeenConnected.value = false;
      }, CONNECTED_DISPLAY_TIME);
    }
  });

  const status = computed((): StatusType | null => {
    switch (true) {
      case !isOnline.value:
        return {
          statusMessage: t('connectionStatus.offline.statusMessage'),
          title: t('connectionStatus.offline.title'),
          description: t('connectionStatus.offline.description'),
          icon: 'warning',
        };
      case !isLoggedIn.value:
        return null;
      case isAeNodeConnecting.value:
        return {
          statusMessage: t('connectionStatus.node.connecting'),
        };
      case justBeenConnected.value:
        return {
          statusMessage: t('connectionStatus.node.connected'),
        };
      case isAeNodeError.value:
        return {
          statusMessage: t('connectionStatus.node.error.statusMessage'),
          title: t('connectionStatus.node.error.title'),
          description: t('connectionStatus.node.error.description'),
          icon: 'critical',
        };
      case isMiddlewareUnavailable.value:
        return {
          statusMessage: t('connectionStatus.middleware.error.title'),
          title: t('connectionStatus.middleware.error.title'),
          description: t('connectionStatus.middleware.error.description'),
          icon: 'critical',
        };
      case isBackendUnavailable.value && isMultisigBackendUnavailable.value:
        return {
          statusMessage: t('connectionStatus.backend.statusMessage'),
          title: t('connectionStatus.backend.title'),
          description: t('connectionStatus.backend.description'),
          icon: 'critical',
        };
      case isEtherscanUnavailable.value:
        return {
          statusMessage: t('connectionStatus.etherscan.statusMessage'),
          title: t('connectionStatus.etherscan.title'),
          description: t('connectionStatus.etherscan.description'),
          icon: 'critical',
        };
      case showMultisigError.value:
        return {
          statusMessage: t('connectionStatus.multisig.statusMessage'),
          title: t('connectionStatus.multisig.title'),
          description: t('connectionStatus.multisig.description'),
          icon: 'critical',
        };
      case isBackendUnavailable.value:
        return {
          statusMessage: t('connectionStatus.aeternityBackend.statusMessage'),
          title: t('connectionStatus.aeternityBackend.title'),
          description: t('connectionStatus.aeternityBackend.description'),
          icon: 'critical',
        };
      case (
        middlewareStatus.value
        && !middlewareStatus.value.mdwSynced
        && (
          middlewareStatus.value.nodeHeight - middlewareStatus.value.mdwHeight
        ) > middlewareUnsynchronizedThreshold
      ):
        return {
          statusMessage: t('connectionStatus.middleware.syncing.statusMessage'),
          title: t('connectionStatus.middleware.syncing.title'),
          description: t('connectionStatus.middleware.syncing.description'),
          icon: 'warning',
        };
      default:
        return null;
    }
  });

  return {
    isError,
    status,
  };
}
