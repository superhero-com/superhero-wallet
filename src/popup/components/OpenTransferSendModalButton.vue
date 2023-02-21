<template>
  <BtnBox
    :text="$t('dashboard.sendCard.title')"
    :subtitle="isBig ? $t('dashboard.sendCard.description') : ''"
    :icon="ArrowSendIcon"
    :disabled="!isConnected"
    data-cy="send"
    :is-big="isBig"
    @click="openTransferSendModal()"
  />
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { useGetter } from '../../composables/vuex';
import { MODAL_TRANSFER_SEND } from '../utils';
import BtnBox from './buttons/BtnBox.vue';
import ArrowSendIcon from '../../icons/arrow-send.svg?vue-component';

export default defineComponent({
  components: { BtnBox },
  props: {
    isBig: Boolean,
  },
  setup(props, { root }) {
    const isConnected = useGetter('isConnected');

    function openTransferSendModal() {
      root.$store.dispatch('modals/open', {
        name: MODAL_TRANSFER_SEND,
      });
    }

    return {
      isConnected,
      ArrowSendIcon,
      openTransferSendModal,
    };
  },
});
</script>
