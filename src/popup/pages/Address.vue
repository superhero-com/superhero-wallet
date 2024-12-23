<template>
  <IonPage />
</template>

<script lang="ts">
import { IonPage } from '@ionic/vue';
import { computed, defineComponent, onMounted } from 'vue';
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
        openCallbackOrGoHome(false);
        if (error instanceof RejectedByUserError) {
          handleUnknownError(error);
        }
      } finally {
        setLoaderVisible(false);
      }
    });
  },
});
</script>
