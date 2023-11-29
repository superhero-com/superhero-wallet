<script lang="ts">
import { computed, defineComponent, onMounted } from 'vue';
import { useStore } from 'vuex';
import type { IAppData } from '@/types';
import {
  useAccounts,
  useDeepLinkApi,
  useAeSdk,
  useModals,
} from '@/composables';
import { handleUnknownError } from '@/utils';
import { RejectedByUserError } from '@/lib/errors';
import { MODAL_CONFIRM_CONNECT, POPUP_CONNECT_ADDRESS_PERMISSION } from '@/constants';

export default defineComponent({
  name: 'Address',
  setup() {
    const store = useStore();

    const { nodeNetworkId } = useAeSdk({ store });
    const { openCallbackOrGoHome, callbackOrigin } = useDeepLinkApi();
    const { activeAccount } = useAccounts({ store });
    const { openModal } = useModals();

    const app = computed((): IAppData => callbackOrigin.value ? {
      name: callbackOrigin.value.hostname,
      url: callbackOrigin.value.origin,
      host: callbackOrigin.value.host,
    } : {} as IAppData);

    onMounted(async () => {
      try {
        await openModal(MODAL_CONFIRM_CONNECT, {
          access: [POPUP_CONNECT_ADDRESS_PERMISSION],
          app: app.value,
        });
        openCallbackOrGoHome(true, {
          address: activeAccount.value.address,
          networkId: nodeNetworkId.value!,
        });
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
