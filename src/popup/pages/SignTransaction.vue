<script lang="ts">
import {
  defineComponent,
  onMounted,
} from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useDeepLinkApi, useSdk } from '../../composables';
import { MODAL_DEFAULT, handleUnknownError } from '../utils';

export default defineComponent({
  name: 'SignTransaction',
  setup(props) {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    const { t } = useI18n();

    onMounted(async () => {
      const { openCallbackOrGoHome } = useDeepLinkApi({ router });
      const { getSdk } = useSdk({ store });

      try {
        const sdk = await getSdk();
        const { transaction, networkId, broadcast } = route.query;
        const currentNetworkId = store.getters.activeNetwork.networkId;

        if (networkId !== currentNetworkId) {
          await store.dispatch('modals/open', {
            name: MODAL_DEFAULT,
            icon: 'warning',
            title: t('modals.wrongNetwork.title'),
            msg: t('modals.wrongNetwork.msg', [networkId]),
            buttonMessage: t('modals.wrongNetwork.button'),
          });
          openCallbackOrGoHome(false);
          return;
        }

        const signedTransaction = await sdk.signTransaction(transaction, { networkId });

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
