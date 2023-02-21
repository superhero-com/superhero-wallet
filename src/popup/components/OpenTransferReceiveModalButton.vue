<template>
  <BtnBox
    :text="$t('dashboard.receiveCard.title')"
    :subtitle="isBig ? $t('dashboard.receiveCard.description') : ''"
    :icon="ArrowReceiveIcon"
    :is-big="isBig"
    @click="openTransferReceiveModal()"
  />
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { MODAL_TRANSFER_RECEIVE } from '../utils';
import BtnBox from './buttons/BtnBox.vue';
import ArrowReceiveIcon from '../../icons/arrow-receive.svg?vue-component';

export default defineComponent({
  components: { BtnBox },
  props: {
    isMultisig: Boolean,
    isBig: Boolean,
  },
  setup(props, { root }) {
    function openTransferReceiveModal() {
      root.$store.dispatch('modals/open', {
        name: MODAL_TRANSFER_RECEIVE,
        isMultisig: props.isMultisig,
      });
    }

    return {
      ArrowReceiveIcon,
      openTransferReceiveModal,
    };
  },
});
</script>
