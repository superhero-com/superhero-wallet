<template>
  <BtnBox
    data-cy="send"
    :text="isMultisig ? $t('dashboard.proposeCard.title') : $t('common.send')"
    :subtitle="subtitle"
    :icon="ArrowSendIcon"
    :disabled="disabled || !isOnline"
    :is-big="isBig"
    @click="openTransferSendModal()"
  />
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AssetContractId } from '@/types';
import { MODAL_TRANSFER_SEND } from '@/constants';
import { useConnection, useModals } from '@/composables';

import BtnBox from './buttons/BtnBox.vue';
import ArrowSendIcon from '../../icons/arrow-send.svg?vue-component';

export default defineComponent({
  components: { BtnBox },
  props: {
    isBig: Boolean,
    isMultisig: Boolean,
    isAirGap: Boolean,
    tokenContractId: { type: String as PropType<AssetContractId>, default: '' },
    disabled: Boolean,
  },
  setup(props) {
    const { t } = useI18n();

    const { isOnline } = useConnection();
    const { openModal } = useModals();

    function openTransferSendModal() {
      openModal(MODAL_TRANSFER_SEND, {
        isMultisig: props.isMultisig,
        isAirGap: props.isAirGap,
        tokenContractId: props.tokenContractId,
      });
    }

    const subtitle = computed(() => (props.isMultisig)
      ? t('dashboard.proposeCard.description')
      : t('dashboard.sendCard.description'));

    return {
      isOnline,
      subtitle,
      ArrowSendIcon,
      openTransferSendModal,
    };
  },
});
</script>
