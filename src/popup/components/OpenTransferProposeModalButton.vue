<template>
  <BtnBox
    :text="$t('dashboard.proposeCard.title')"
    :subtitle="isBig ? $t('dashboard.proposeCard.description') : ''"
    :icon="ArrowSendIcon"
    :disabled="!isConnected || !!pendingMultisigTransaction"
    data-cy="send"
    :is-big="isBig"
    @click="openTransferProposeModal()"
  />
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { usePendingMultisigTransaction } from '../../composables';
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
    const { pendingMultisigTransaction } = usePendingMultisigTransaction({ store: root.$store });

    const isConnected = useGetter('isConnected');

    function openTransferProposeModal() {
      root.$store.dispatch('modals/open', {
        name: MODAL_TRANSFER_SEND,
        isMultisig: true,
      });
    }

    return {
      pendingMultisigTransaction,
      isConnected,
      ArrowSendIcon,
      openTransferProposeModal,
    };
  },
});
</script>
