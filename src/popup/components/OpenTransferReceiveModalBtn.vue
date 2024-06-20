<template>
  <BtnBox
    :text="$t('common.receive')"
    :subtitle="subtitle"
    :icon="ArrowReceiveIcon"
    :is-big="isBig"
    :disabled="disabled"
    data-cy="receive"
    @click="openTransferReceiveModal()"
  />
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { MODAL_TRANSFER_RECEIVE } from '@/constants';
import { useModals } from '@/composables';
import BtnBox from './buttons/BtnBox.vue';
import ArrowReceiveIcon from '../../icons/arrow-receive.svg?vue-component';

export default defineComponent({
  components: { BtnBox },
  props: {
    isBig: Boolean,
    isMultisig: Boolean,
    tokenContractId: { type: String, default: '' },
    disabled: Boolean,
  },
  setup(props) {
    const { openModal } = useModals();
    const { t } = useI18n();

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
        ? t('dashboard.receiveCard.descriptionMultisig')
        : t('dashboard.receiveCard.description');
    });

    return {
      subtitle,
      ArrowReceiveIcon,
      openTransferReceiveModal,
    };
  },
});
</script>
