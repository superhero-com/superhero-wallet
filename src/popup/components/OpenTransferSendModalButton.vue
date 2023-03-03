<template>
  <BtnBox
    :text="isMultisig ? $t('dashboard.proposeCard.title') : $t('dashboard.sendCard.title')"
    :subtitle="isBig ? $t('dashboard.sendCard.description') : ''"
    :icon="ArrowSendIcon"
    :disabled="!isConnected || (!!pendingMultisigTransaction && isMultisig)"
    data-cy="send"
    :is-big="isBig"
    @click="openTransferSendModal()"
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
    isMultisig: Boolean,
    tokenContractId: { type: String, default: '' },
  },
  setup(props, { root }) {
    const { pendingMultisigTransaction } = usePendingMultisigTransaction({ store: root.$store });

    const isConnected = useGetter('isConnected');

    function openTransferSendModal() {
      root.$store.dispatch('modals/open', {
        name: MODAL_TRANSFER_SEND,
        isMultisig: props.isMultisig,
        tokenContractId: props.tokenContractId,
      });
    }

    return {
      isConnected,
      pendingMultisigTransaction,
      ArrowSendIcon,
      openTransferSendModal,
    };
  },
});
</script>
