<template>
  <IonPage />
</template>

<script lang="ts">
import { IonPage } from '@ionic/vue';
import { computed, defineComponent, onMounted } from 'vue';
import type { IAppData } from '@/types';
import {
  useAccounts,
  useDeepLinkApi,
  useAeSdk,
  useModals,
} from '@/composables';
import { handleUnknownError } from '@/utils';
import { RejectedByUserError } from '@/lib/errors';
import {
  MODAL_CONFIRM_CONNECT,
  POPUP_CONNECT_ADDRESS_PERMISSION,
  UNKNOWN_APP_DETAILS,
} from '@/constants';

export default defineComponent({
  name: 'Address',
  components: {
    IonPage,
  },
  setup() {
    const { nodeNetworkId } = useAeSdk();
    const { openCallbackOrGoHome, callbackOrigin, setIsDeepLinkUsed } = useDeepLinkApi();
    const { activeAccount } = useAccounts();
    const { openModal } = useModals();

    const app = computed((): IAppData => callbackOrigin.value?.toString() ? {
      name: callbackOrigin.value.hostname,
      url: callbackOrigin.value.origin,
      host: callbackOrigin.value.host,
    } : UNKNOWN_APP_DETAILS);

    onMounted(async () => {
      try {
        setIsDeepLinkUsed(true);
        await openModal(MODAL_CONFIRM_CONNECT, {
          access: [POPUP_CONNECT_ADDRESS_PERMISSION],
          app: app.value,
        });
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
        setIsDeepLinkUsed(false);
      }
    });
  },
});
</script>
