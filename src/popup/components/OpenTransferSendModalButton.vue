<template>
  <BtnBox
    :text="isMultisig ? $t('dashboard.proposeCard.title') : $t('dashboard.sendCard.title')"
    :subtitle="subtitle"
    :icon="ArrowSendIcon"
    :disabled="!isOnline || !isConnected || (!!pendingMultisigTransaction && isMultisig)"
    data-cy="send"
    :is-big="isBig"
    @click="openTransferSendModal()"
  />
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import { useConnection, usePendingMultisigTransaction } from '../../composables';
import { useGetter } from '../../composables/vuex';
import { MODAL_TRANSFER_SEND } from '../utils';

import BtnBox from './buttons/BtnBox.vue';
import ArrowSendIcon from '../../icons/arrow-send.svg?vue-component';

export default defineComponent({
  components: { BtnBox },
  props: {
    isBig: Boolean,
    isMultisig: Boolean,
    isAirGap: Boolean,
    tokenContractId: { type: String, default: '' },
  },
  setup(props, { root }) {
    const { isOnline } = useConnection();
    const { pendingMultisigTransaction } = usePendingMultisigTransaction({ store: root.$store });

    const isConnected = useGetter('isConnected');

    function openTransferSendModal() {
      root.$store.dispatch('modals/open', {
        name: MODAL_TRANSFER_SEND,
        isMultisig: props.isMultisig,
        isAirGap: props.isAirGap,
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
