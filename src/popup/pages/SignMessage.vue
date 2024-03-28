<template>
  <IonPage />
</template>

<script lang="ts">
import { IonPage } from '@ionic/vue';
import { defineComponent, onMounted } from 'vue';
import { useRoute } from 'vue-router';

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
    const route = useRoute();

    onMounted(async () => {
      const { callbackOrigin, openCallbackOrGoHome } = useDeepLinkApi();
      const { getAeSdk } = useAeSdk();
      const { openModal } = useModals();
      const { setLoaderVisible } = useUi();

      try {
        setLoaderVisible(true);
        const aeSdk = await getAeSdk();
        const rawMessage = route.query.message?.toString();
        const isHexEncodedMessage = !!rawMessage && route.query.encoding?.toString() === 'hex';
        const message = isHexEncodedMessage ? Buffer.from(rawMessage, 'hex') : rawMessage;
        const displayMessage = message?.toString();
        const { host, href } = callbackOrigin.value || {} as any;

        await openModal(MODAL_MESSAGE_SIGN, {
          message: displayMessage,
          app: {
            host,
            name: host,
            url: href,
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
