<template>
  <BtnBox
    :text="$t('common.share')"
    :icon="QrIcon"
    :is-big="isBig"
    :disabled="disabled"
    data-cy="share-address"
    @click="shareAddress()"
  />
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue';

import type { AccountAddress, Protocol } from '@/types';
import { useModals } from '@/composables';

import BtnBox from '@/popup/components/buttons/BtnBox.vue';

import QrIcon from '@/icons/qr-code.svg?vue-component';

export default defineComponent({
  components: { BtnBox },
  props: {
    address: { type: String as PropType<AccountAddress>, required: true },
    protocol: { type: String as PropType<Protocol>, required: true },
    isBig: Boolean,
    disabled: Boolean,
  },
  setup(props) {
    const { openShareAddressModal } = useModals();

    function shareAddress() {
      openShareAddressModal({
        address: props.address,
        protocol: props.protocol,
      });
    }

    return {
      QrIcon,
      shareAddress,
    };
  },
});
</script>
