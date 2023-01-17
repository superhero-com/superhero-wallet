<script lang="ts">
import {
  defineComponent,
  onMounted,
} from '@vue/composition-api';
import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';
import { useDeepLinkApi, useSdk } from '../../composables';
import { MODAL_DEFAULT, handleUnknownError, watchUntilTruthy } from '../utils';

export default defineComponent({
  name: 'SignTransaction',
  setup(props, { root }) {
    onMounted(async () => {
      const { openCallbackOrGoHome } = useDeepLinkApi({ router: root.$router });

      try {
        const { sdk } = useSdk({ store: root.$store });
        await watchUntilTruthy(() => sdk);
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

        const signedTransaction = await sdk.value.signTransaction(
          transaction as Encoded.Transaction,
          { networkId: currentNetworkId },
        );

        if (broadcast) {
          const result = await sdk.value.sendTransaction(signedTransaction, { waitMined: true });
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
