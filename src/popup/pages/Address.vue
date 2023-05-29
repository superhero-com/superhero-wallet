<template>
  <Connect
    :access="[POPUP_CONNECT_ADDRESS_PERMISSION]"
  />
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { IAppData } from '../../types';
import { useAccounts, useDeepLinkApi, usePopupProps } from '../../composables';
import { POPUP_CONNECT_ADDRESS_PERMISSION } from '../utils/constants';
import Connect from './Popups/Connect.vue';

export default defineComponent({
  name: 'Address',
  components: { Connect },
  setup() {
    const store = useStore();
    const router = useRouter();

    const { openCallbackOrGoHome, callbackOrigin } = useDeepLinkApi({ router });
    const { activeAccount } = useAccounts({ store });
    const { setPopupProps } = usePopupProps();

    const app = computed((): Partial<IAppData> => callbackOrigin.value ? ({
      name: callbackOrigin.value.hostname,
      url: callbackOrigin.value.origin,
      host: callbackOrigin.value.host,
    }) : {});

    const onResolve = () => openCallbackOrGoHome(true, {
      address: activeAccount.value.address,
      networkId: store.getters.activeNetwork.networkId,
    });

    const onReject = () => openCallbackOrGoHome(false);

    setPopupProps({
      app: app.value as IAppData,
      resolve: onResolve,
      reject: onReject,
    });

    return {
      POPUP_CONNECT_ADDRESS_PERMISSION,
    };
  },
});
</script>
