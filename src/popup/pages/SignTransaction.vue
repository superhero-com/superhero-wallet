<script lang="ts">
import {
  defineComponent,
  onMounted,
} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { Encoded } from '@aeternity/aepp-sdk';

import { DEFAULT_WAITING_HEIGHT } from '@/constants';
import { RejectedByUserError } from '@/lib/errors';
import { handleUnknownError } from '@/utils';
import {
  useDeepLinkApi,
  useModals,
  useAeSdk,
} from '@/composables';

export default defineComponent({
  name: 'SignTransaction',
  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    const { t } = useI18n();

    onMounted(async () => {
      const { callbackOrigin, openCallbackOrGoHome } = useDeepLinkApi({ router });
      const { nodeNetworkId, getAeSdk } = useAeSdk({ store });
      const { openDefaultModal } = useModals();

      try {
        const aeSdk = await getAeSdk();
        const { transaction, networkId, broadcast } = route.query;

        if (networkId !== nodeNetworkId.value) {
          await openDefaultModal({
            icon: 'warning',
            title: t('modals.wrongNetwork.title'),
            msg: t('modals.wrongNetwork.msg', [networkId]),
            buttonMessage: t('modals.wrongNetwork.button'),
          });
          openCallbackOrGoHome(false);
          return;
        }

        const signedTransaction = await aeSdk.signTransaction(
          transaction as Encoded.Transaction,
          {
            networkId,
            aeppOrigin: callbackOrigin.value?.toString(),
          },
        );

        if (broadcast) {
          const { txHash } = await aeSdk.api.postTransaction({ tx: signedTransaction });
          await aeSdk.poll(txHash, { blocks: DEFAULT_WAITING_HEIGHT });
          openCallbackOrGoHome(true, { 'transaction-hash': txHash });
        } else {
          openCallbackOrGoHome(true, { transaction: signedTransaction });
        }
      } catch (error: any) {
        await openDefaultModal({
          title: t('modals.transaction-failed.msg'),
          icon: 'critical',
          msg: error.message,
        });
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
