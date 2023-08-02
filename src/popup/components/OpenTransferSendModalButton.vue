<template>
  <BtnBox
    :text="isMultisig ? $t('dashboard.proposeCard.title') : $t('common.send')"
    :subtitle="subtitle"
    :icon="ArrowSendIcon"
    :disabled="!isOnline || !isConnected || (!!pendingMultisigTransaction && isMultisig)"
    data-cy="send"
    :is-big="isBig"
    @click="openTransferSendModal()"
  />
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { MODAL_TRANSFER_SEND } from '@/config';
import { useConnection, useModals, usePendingMultisigTransaction } from '@/composables';
import { useGetter } from '@/composables/vuex';

import BtnBox from './buttons/BtnBox.vue';
import ArrowSendIcon from '../../icons/arrow-send.svg?vue-component';

export default defineComponent({
  components: { BtnBox },
  props: {
    isBig: Boolean,
    isMultisig: Boolean,
    tokenContractId: { type: String, default: '' },
  },
  setup(props) {
    const store = useStore();
    const { t } = useI18n();

    const { isOnline } = useConnection();
    const { openModal } = useModals();
    const { pendingMultisigTransaction } = usePendingMultisigTransaction({ store });

    const isConnected = useGetter('isConnected');

    function openTransferSendModal() {
      openModal(MODAL_TRANSFER_SEND, {
        isMultisig: props.isMultisig,
        tokenContractId: props.tokenContractId,
      });
    }

    const subtitle = computed(() => (props.isMultisig)
      ? t('dashboard.proposeCard.description')
      : t('dashboard.sendCard.description'));

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
