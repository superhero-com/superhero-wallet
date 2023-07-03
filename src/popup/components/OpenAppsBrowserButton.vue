<template>
  <BtnIcon
    class="apps-browser"
    data-cy="apps-browser-btn"
    text="Browser"
    :icon="GlobeSmallIcon"
    :dimmed="isDisabled"
    :disabled="isDisabled"
    @click="openAppsBrowserScreen()"
  />
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useRouter } from 'vue-router';
import { useAccounts } from '@/composables';
import { useStore } from 'vuex';
import { PROTOCOL_AETERNITY } from '@/constants';
import { ROUTE_APPS_BROWSER } from '../router/routeNames';

import BtnIcon from './buttons/BtnIcon.vue';
import GlobeSmallIcon from '../../icons/globe-small.svg?vue-component';

export default defineComponent({
  components: { BtnIcon },
  props: {
    isBig: Boolean,
    isMultisig: Boolean,
    tokenContractId: { type: String, default: '' },
  },
  setup() {
    const router = useRouter();
    const store = useStore();
    const { activeAccount } = useAccounts({ store });

    const isAeAccount = computed(() => activeAccount.value.protocol === PROTOCOL_AETERNITY);
    const isDisabled = computed(() => !isAeAccount.value);

    function openAppsBrowserScreen() {
      router.push({ name: ROUTE_APPS_BROWSER });
    }

    return {
      GlobeSmallIcon,
      openAppsBrowserScreen,
      isDisabled,
    };
  },
});
</script>
