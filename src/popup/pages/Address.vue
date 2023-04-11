<template>
  <Connect
    :app="app"
    :resolve="onResolve"
    :reject="onReject"
    :access="[POPUP_CONNECT_ADDRESS_PERMISSION]"
  />
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { IAppData } from '../../types';
import { useDeepLinkApi } from '../../composables';
import { POPUP_CONNECT_ADDRESS_PERMISSION } from '../utils/constants';
import Connect from './Popups/Connect.vue';

export default defineComponent({
  name: 'Address',
  components: { Connect },
  setup(props) {
    const store = useStore();
    const router = useRouter();

    const { openCallbackOrGoHome, callbackOrigin } = useDeepLinkApi({ router });
    const app = computed((): Partial<IAppData> => callbackOrigin.value ? ({
      name: callbackOrigin.value.hostname,
      url: callbackOrigin.value.origin,
      host: callbackOrigin.value.host,
    }) : {});

    const onResolve = () => openCallbackOrGoHome(true, {
      address: store.getters.account.address,
      networkId: store.getters.activeNetwork.networkId,
    });

    const onReject = () => openCallbackOrGoHome(false);

    return {
      onResolve,
      onReject,
      app,
      POPUP_CONNECT_ADDRESS_PERMISSION,
    };
  },
});
</script>
