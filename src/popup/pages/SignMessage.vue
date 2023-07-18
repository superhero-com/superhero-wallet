<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { RejectedByUserError } from '../../lib/errors';
import { useDeepLinkApi, useModals, useSdk } from '../../composables';
import { MODAL_MESSAGE_SIGN, handleUnknownError } from '../utils';

export default defineComponent({
  name: 'SignMessage',
  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();

    onMounted(async () => {
      const { callbackOrigin, openCallbackOrGoHome } = useDeepLinkApi({ router });
      const { getSdk } = useSdk({ store });
      const { openModal } = useModals();

      try {
        const sdk = await getSdk();
        const { message } = route.query;

        await openModal(MODAL_MESSAGE_SIGN, {
          message,
          app: {
            name: callbackOrigin.value?.host,
            host: callbackOrigin.value?.host,
            url: callbackOrigin.value?.href,
          },
        });

        const signature = await sdk.signMessage(message as string);
        const signatureHex = Buffer.from(signature).toString('hex');
        openCallbackOrGoHome(true, { signature: signatureHex });
      } catch (error: any) {
        openCallbackOrGoHome(false);

        if (error instanceof RejectedByUserError) {
          handleUnknownError(error);
        }
      }
    });
  },
  render() {
    return null as any;
  },
});
</script>
