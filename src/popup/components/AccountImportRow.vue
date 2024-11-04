<template>
  <AccountSelectOptionsItem
    :custom-account="account"
    :outside-balance="balance"
    clickable
  />
</template>

<script lang="ts">
import BigNumber from 'bignumber.js';
import {
  defineComponent,
  onMounted,
  ref,
  PropType,
} from 'vue';

import type { IAccount } from '@/types';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { ROUTE_ACCOUNT_DETAILS } from '@/popup/router/routeNames';

import AccountSelectOptionsItem from './AccountSelectOptionsItem.vue';

export default defineComponent({
  components: {
    AccountSelectOptionsItem,
  },
  props: {
    account: { type: Object as PropType<IAccount>, required: true },
  },
  setup(props) {
    const balance = ref(0);

    onMounted(async () => {
      const adapter = ProtocolAdapterFactory.getAdapter(props.account.protocol);
      balance.value = new BigNumber(await adapter.fetchBalance(props.account.address)).toNumber();
    });

    return {
      balance,
      ROUTE_ACCOUNT_DETAILS,
    };
  },
});
</script>
