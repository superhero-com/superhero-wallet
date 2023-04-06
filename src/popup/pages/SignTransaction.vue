<script lang="ts">
import {
  defineComponent,
  getCurrentInstance,
  onMounted,
} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { RejectedByUserError } from '../../lib/errors';
import { handleUnknownError } from '../utils';
import { useDeepLinkApi, useModals, useSdk } from '../../composables';

export default defineComponent({
  name: 'SignTransaction',
  setup(props) {
    console.log(props);
    const instance = getCurrentInstance();
    const root = instance?.root as any;
    const store = useStore();
    const router = useRouter();
    const route = useRoute();

    onMounted(async () => {
      const { callbackOrigin, openCallbackOrGoHome } = useDeepLinkApi({ router });
      const { nodeNetworkId, getSdk } = useSdk({ store });
      const { openDefaultModal } = useModals();

      try {
        const sdk = await getSdk();
        const { transaction, networkId, broadcast } = route.query;

        if (networkId !== nodeNetworkId.value) {
          await openDefaultModal({
            icon: 'warning',
            title: root.$t('modals.wrongNetwork.title'),
            msg: root.$t('modals.wrongNetwork.msg', [networkId]),
            buttonMessage: root.$t('modals.wrongNetwork.button'),
          });
          openCallbackOrGoHome(false);
          return;
        }

        const signedTransaction = await sdk.signTransaction(
          transaction, { networkId, app: callbackOrigin.value },
        );

        if (broadcast) {
          const result = await sdk.sendTransaction(signedTransaction, { waitMined: true });
          openCallbackOrGoHome(true, { 'transaction-hash': result.hash });
        } else {
          openCallbackOrGoHome(true, { transaction: signedTransaction });
        }
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
