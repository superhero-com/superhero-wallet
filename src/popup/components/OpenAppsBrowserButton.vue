<template>
  <BtnIcon
    class="apps-browser"
    data-cy="apps-browser-btn"
    text="Browser"
    :icon="GlobeSmallIcon"
    @click="openAppsBrowserScreen()"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';
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

    function openAppsBrowserScreen() {
      router.push({ name: ROUTE_APPS_BROWSER });
    }

    return {
      GlobeSmallIcon,
      openAppsBrowserScreen,
    };
  },
});
</script>
