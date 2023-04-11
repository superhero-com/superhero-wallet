<script lang="ts">
import {
  defineComponent,
  onMounted,
} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { useDeepLinkApi, useModals, useSdk } from '../../composables';
import { handleUnknownError } from '../utils';

export default defineComponent({
  name: 'SignTransaction',
  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    const { t } = useI18n();

    onMounted(async () => {
      const { callbackOrigin, openCallbackOrGoHome } = useDeepLinkApi({ router });
      const { getSdk } = useSdk({ store });
      const { openDefaultModal } = useModals();

      try {
        const sdk = await getSdk();
        const { transaction, networkId, broadcast } = route.query;
        const currentNetworkId = store.getters.activeNetwork.networkId;

        if (networkId !== currentNetworkId) {
          await openDefaultModal({
            icon: 'warning',
            title: t('modals.wrongNetwork.title'),
            msg: t('modals.wrongNetwork.msg', [networkId]),
            buttonMessage: t('modals.wrongNetwork.button'),
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
      } catch (e: any) {
        openCallbackOrGoHome(false);

        if (e.message !== 'Rejected by user') handleUnknownError(e);
      }
    });
  },
  render() {
    return null as any;
  },
});
</script>
