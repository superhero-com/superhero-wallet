<template>
  <IonPage />
</template>

<script lang="ts">
import { IonPage } from '@ionic/vue';
import { defineComponent, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

import { MODAL_MESSAGE_SIGN } from '@/constants';
import { handleUnknownError } from '@/utils';
import { RejectedByUserError } from '@/lib/errors';
import Logger from '@/lib/logger';
import {
  useDeepLinkApi,
  useModals,
  useAeSdk,
  useUi,
} from '@/composables';
import { IAppData } from '@/types';

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
      const { t } = useI18n();

      try {
        setLoaderVisible(true);
        const aeSdk = await getAeSdk();
        const rawMessage = route.query.message?.toString();
        const isHexEncodedMessage = !!rawMessage && route.query.encoding?.toString() === 'hex';
        const message = isHexEncodedMessage ? Buffer.from(rawMessage, 'hex') : rawMessage;
        const displayMessage = message?.toString();
        const { host, href } = callbackOrigin.value || {} as any;
        const app = host && href
          ? {
            host,
            name: host,
            href,
          } : {} as IAppData;

        await openModal(MODAL_MESSAGE_SIGN, {
          message: displayMessage,
          app,
        });

        const signature = await aeSdk.signMessage(message as string);
        const signatureHex = Buffer.from(signature).toString('hex');
        openCallbackOrGoHome(true, { signature: signatureHex, address: aeSdk.address });
      } catch (error: any) {
        if (error instanceof RejectedByUserError) {
          handleUnknownError(error);
        } else {
          await Logger.write({
            title: t('pages.signMessage.signingFailedTitle'),
            message: error.message || t('pages.signMessage.signingFailedMessage'),
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
