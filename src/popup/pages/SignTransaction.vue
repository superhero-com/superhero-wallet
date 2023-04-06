<script lang="ts">
import {
  defineComponent,
  getCurrentInstance,
  onMounted,
} from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useDeepLinkApi, useSdk } from '../../composables';
import { MODAL_DEFAULT, handleUnknownError } from '../utils';

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
            title: root.$t('modals.wrongNetwork.title'),
            msg: root.$t('modals.wrongNetwork.msg', [networkId]),
            buttonMessage: root.$t('modals.wrongNetwork.button'),
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
