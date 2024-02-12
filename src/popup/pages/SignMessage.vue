<template>
  <IonPage />
</template>

<script lang="ts">
import { IonPage } from '@ionic/vue';
import { defineComponent, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { MODAL_MESSAGE_SIGN } from '@/constants';
import { handleUnknownError } from '@/utils';
import { RejectedByUserError } from '@/lib/errors';
import {
  useDeepLinkApi,
  useModals,
  useAeSdk,
  useUi,
} from '@/composables';

export default defineComponent({
  name: 'SignMessage',
  components: {
    IonPage,
  },
  setup() {
    const store = useStore();
    const route = useRoute();

    onMounted(async () => {
      const { callbackOrigin, openCallbackOrGoHome } = useDeepLinkApi();
      const { getAeSdk } = useAeSdk({ store });
      const { openModal } = useModals();
      const { setLoaderVisible } = useUi();

      try {
        setLoaderVisible(true);
        const aeSdk = await getAeSdk();
        const { message } = route.query;

        await openModal(MODAL_MESSAGE_SIGN, {
          message,
          app: {
            name: callbackOrigin.value?.host,
            host: callbackOrigin.value?.host,
            url: callbackOrigin.value?.href,
          },
        });

        const signature = await aeSdk.signMessage(message as string);
        const signatureHex = Buffer.from(signature).toString('hex');
        openCallbackOrGoHome(true, { signature: signatureHex });
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
