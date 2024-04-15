<template>
  <BtnIcon
    class="open-apps-browser-button"
    data-cy="apps-browser-btn"
    :icon="GlobeSmallIcon"
    :to="{ name: ROUTE_APPS_BROWSER }"
    dimmed
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { ROUTE_APPS_BROWSER } from '@/popup/router/routeNames';

import BtnIcon from '@/popup/components/buttons/BtnIcon.vue';

import GlobeSmallIcon from '@/icons/globe-small.svg?vue-component';

export default defineComponent({
  components: { BtnIcon },
  props: {
    isBig: Boolean,
    isMultisig: Boolean,
    tokenContractId: { type: String, default: '' },
  },
  setup() {
    return {
      GlobeSmallIcon,
      ROUTE_APPS_BROWSER,
    };
  },
});
</script>

<style lang="scss" scoped>
.apps-browser {
  opacity: 0.75;
}
</style>
