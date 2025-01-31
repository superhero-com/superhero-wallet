<template>
  <IonPage />
</template>

<script lang="ts">
import { IonPage } from '@ionic/vue';
import { computed, defineComponent, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

import type { IAppData } from '@/types';
import {
  useAccounts,
  useAeSdk,
  useDeepLinkApi,
  useModals,
  useUi,
} from '@/composables';
import { handleUnknownError } from '@/utils';
import { RejectedByUserError } from '@/lib/errors';
import Logger from '@/lib/logger';
import { CONNECT_PERMISSIONS, MODAL_CONFIRM_CONNECT } from '@/constants';

export default defineComponent({
  name: 'Address',
  components: {
    IonPage,
  },
  setup() {
    const { getAeSdk, nodeNetworkId } = useAeSdk();
    const { openCallbackOrGoHome, callbackOrigin } = useDeepLinkApi();
    const { activeAccount } = useAccounts();
    const { openModal } = useModals();
    const { setLoaderVisible } = useUi();
    const { t } = useI18n();

    const app = computed((): IAppData => callbackOrigin.value ? {
      name: callbackOrigin.value.hostname,
      href: callbackOrigin.value.origin,
      host: callbackOrigin.value.host,
    } : {} as IAppData);

    onMounted(async () => {
      try {
        setLoaderVisible(true);
        await openModal(MODAL_CONFIRM_CONNECT, {
          access: [CONNECT_PERMISSIONS.address],
          app: app.value,
        });

        // Sdk should be initialized in order to get a current networkId.
        await getAeSdk();
        openCallbackOrGoHome(true, {
          address: activeAccount.value.address,
          networkId: nodeNetworkId.value!,
        });
      } catch (error: any) {
        if (error instanceof RejectedByUserError) {
          handleUnknownError(error);
        } else {
          await Logger.write({
            title: t('pages.address.connectingFailedTitle'),
            message: error.message || t('pages.address.connectingFailedMessage'),
            type: 'api-response',
            modal: true,
          });
        }
        openCallbackOrGoHome(false);
      } finally {
        setLoaderVisible(false);
      }
    });
  },
});
</script>
