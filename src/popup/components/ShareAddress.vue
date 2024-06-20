<template>
  <ShareAddressBase
    :heading="title ?? $t('pages.account.shareAddress')"
    :account-address="address"
    :protocol="protocol"
    @close="resolve()"
  />
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue';

import type { AccountAddress, Protocol } from '@/types';
import { PROTOCOL_VIEW_TRANSFER_RECEIVE } from '@/constants';

import ShareAddressBase, { shareAddressRequiredProps } from '@/popup/components/Modals/ShareAddressBase.vue';

export default defineComponent({
  name: PROTOCOL_VIEW_TRANSFER_RECEIVE,
  components: {
    ShareAddressBase,
  },
  props: {
    ...shareAddressRequiredProps,
    address: { type: String as PropType<AccountAddress>, required: true },
    protocol: { type: String as PropType<Protocol>, required: true },
    title: { type: String, default: null },
  },
});
</script>
