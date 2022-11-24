<template>
  <BtnBox
    :text="isMultisig ? $t('dashboard.proposeCard.title') : $t('dashboard.sendCard.title')"
    :subtitle="subtitle"
    :icon="ArrowSendIcon"
    :disabled="!isOnline || !isNodeReady || (!!pendingMultisigTransaction && isMultisig)"
    data-cy="send"
    :is-big="isBig"
    @click="openTransferSendModal()"
  />
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import {
  useConnection,
  useModals,
  usePendingMultisigTransaction,
  useSdk,
} from '../../composables';
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
    const { isOnline } = useConnection();
    const { openModal } = useModals();
    const { isNodeReady } = useSdk({ store: root.$store });
    const { pendingMultisigTransaction } = usePendingMultisigTransaction({ store: root.$store });

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
      isNodeReady,
      pendingMultisigTransaction,
      subtitle,
      ArrowSendIcon,
      openTransferSendModal,
    };
  },
});
</script>
