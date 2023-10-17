<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <Connect
        :access="[POPUP_CONNECT_ADDRESS_PERMISSION]"
      />
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { IonContent, IonPage } from '@ionic/vue';
import { computed, defineComponent } from 'vue';
import type { IAppData } from '@/types';
import {
  useAccounts,
  useDeepLinkApi,
  useAeSdk,
  usePopupProps,
} from '@/composables';
import { POPUP_CONNECT_ADDRESS_PERMISSION } from '@/constants';
import Connect from './Popups/Connect.vue';

export default defineComponent({
  name: 'Address',
  components: {
    Connect,
    IonContent,
    IonPage,
  },
  setup() {
    const { nodeNetworkId } = useAeSdk();
    const { openCallbackOrGoHome, callbackOrigin } = useDeepLinkApi();
    const { activeAccount } = useAccounts();
    const { setPopupProps } = usePopupProps();

    const app = computed((): IAppData => callbackOrigin.value ? {
      name: callbackOrigin.value.hostname,
      url: callbackOrigin.value.origin,
      host: callbackOrigin.value.host,
    } : {} as IAppData);

    const onResolve = () => openCallbackOrGoHome(true, {
      address: activeAccount.value.address,
      networkId: nodeNetworkId.value!,
    });

    const onReject = () => openCallbackOrGoHome(false);

    setPopupProps({
      app: app.value,
      resolve: onResolve,
      reject: onReject,
    });

    return {
      POPUP_CONNECT_ADDRESS_PERMISSION,
    };
  },
});
</script>
