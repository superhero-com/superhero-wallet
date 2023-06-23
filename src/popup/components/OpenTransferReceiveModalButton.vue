<template>
  <BtnBox
    :text="$t('common.receive')"
    :subtitle="subtitle"
    :icon="ArrowReceiveIcon"
    :is-big="isBig"
    @click="openTransferReceiveModal()"
  />
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import { MODAL_TRANSFER_RECEIVE } from '../utils';
import { useModals } from '../../composables';
import BtnBox from './buttons/BtnBox.vue';
import ArrowReceiveIcon from '../../icons/arrow-receive.svg?vue-component';

export default defineComponent({
  components: { BtnBox },
  props: {
    isBig: Boolean,
    isMultisig: Boolean,
    tokenContractId: { type: String, default: '' },
  },
  setup(props, { root }) {
    const { openModal } = useModals();

    function openTransferReceiveModal() {
      openModal(MODAL_TRANSFER_RECEIVE, {
        isMultisig: props.isMultisig,
        tokenContractId: props.tokenContractId,
      });
    }

    const subtitle = computed(() => {
      if (!props.isBig) {
        return '';
      }
      return props.isMultisig
        ? root.$t('dashboard.receiveCard.descriptionMultisig')
        : root.$t('dashboard.receiveCard.description');
    });

    return {
      subtitle,
      ArrowReceiveIcon,
      openTransferReceiveModal,
    };
  },
});
</script>
