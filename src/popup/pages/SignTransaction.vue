<script lang="ts">
import {
  defineComponent,
  onMounted,
} from '@vue/composition-api';
import { useDeepLinkApi } from '../../composables';
import { handleUnknownError, watchUntilTruthy } from '../utils/helper';
import { MODAL_DEFAULT } from '../utils';

export default defineComponent({
  name: 'SignTransaction',
  setup(props, { root }) {
    onMounted(async () => {
      const { openCallbackOrGoHome } = useDeepLinkApi({ router: root.$router });

      try {
        await watchUntilTruthy(() => root.$store.state.sdk);
        const { transaction, networkId, broadcast } = root.$route.query;
        const currentNetworkId = root.$store.getters.activeNetwork.networkId;

        if (networkId !== currentNetworkId) {
          await root.$store.dispatch('modals/open', {
            name: MODAL_DEFAULT,
            icon: 'warning',
            title: root.$t('modals.wrongNetwork.title'),
            msg: root.$t('modals.wrongNetwork.msg', [networkId]),
            buttonMessage: root.$t('modals.wrongNetwork.button'),
          });
          openCallbackOrGoHome(false);
          return;
        }

        const signedTransaction = await root.$store.state.sdk
          .signTransaction(transaction, { networkId });

        if (broadcast) {
          const result = await root.$store.state.sdk
            .sendTransaction(signedTransaction, { waitMined: true });
          openCallbackOrGoHome(true, { 'transaction-hash': result.hash });
        } else {
          openCallbackOrGoHome(true, { transaction: signedTransaction });
        }
      } catch (e:any) {
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
