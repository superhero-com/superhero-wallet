<template>
  <BtnBox
    :text="isMultisig ? $t('dashboard.proposeCard.title') : $t('common.send')"
    :subtitle="showSubtitle ? subtitle : null"
    :icon="ArrowSendIcon"
    :disabled="!isOnline || !isConnected || (!!pendingMultisigTransaction && isMultisig)"
    data-cy="send"
    :is-big="isBig"
    @click="openTransferSendModal()"
  />
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import { useConnection, useModals, usePendingMultisigTransaction } from '../../composables';
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
    showSubtitle: { type: Boolean, default: true },
  },
  setup(props, { root }) {
    const { isOnline } = useConnection();
    const { openModal } = useModals();
    const { pendingMultisigTransaction } = usePendingMultisigTransaction({ store: root.$store });

    const isConnected = useGetter('isConnected');

    function openTransferSendModal() {
      openModal(MODAL_TRANSFER_SEND, {
        isMultisig: props.isMultisig,
        tokenContractId: props.tokenContractId,
      });
    }

    const subtitle = computed(() => (props.isMultisig)
      ? root.$t('dashboard.proposeCard.description')
      : root.$t('dashboard.sendCard.description'));

    return {
      isOnline,
      isConnected,
      pendingMultisigTransaction,
      subtitle,
      ArrowSendIcon,
      openTransferSendModal,
    };
  },
});
</script>
