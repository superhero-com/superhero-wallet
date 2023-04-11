<template>
  <BtnBox
    :text="$t('dashboard.receiveCard.title')"
    :subtitle="subtitle"
    :icon="ArrowReceiveIcon"
    :is-big="isBig"
    @click="openTransferReceiveModal()"
  />
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { MODAL_TRANSFER_RECEIVE } from '../utils';
import BtnBox from './buttons/BtnBox.vue';
import ArrowReceiveIcon from '../../icons/arrow-receive.svg?vue-component';

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

    function openTransferReceiveModal() {
      store.dispatch('modals/open', {
        name: MODAL_TRANSFER_RECEIVE,
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
