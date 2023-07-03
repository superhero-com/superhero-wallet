<template>
  <BtnBox
    text="Browser"
    :icon="GlobeSmallIcon"
    :is-big="isBig"
    @click="openAppsBrowserScreen()"
  />
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import BtnBox from './buttons/BtnBox.vue';
import GlobeSmallIcon from '../../icons/globe-small.svg?vue-component';

export default defineComponent({
  components: { BtnBox },
  props: {
    isBig: Boolean,
    isMultisig: Boolean,
    tokenContractId: { type: String, default: '' },
  },
  setup(props, { root }) {
    function openAppsBrowserScreen() {
      root.$router.push({ name: 'apps-browser' });
    }

    return {
      GlobeSmallIcon,
      openAppsBrowserScreen,
    };
  },
});
</script>
