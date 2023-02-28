<template>
  <AccountCardBase
    :address="account.gaAccountId"
    :selected="selected"
    :to="{ name: ROUTE_MULTISIG_DETAILS }"
  >
    <template #top="{ color }">
      <AccountInfo
        :address="account.gaAccountId"
        :color="color"
        is-multisig
      />
    </template>

    <template #middle>
      <BalanceInfo :balance="+account.balance" />
    </template>

    <template #bottom>
      <AccountCardConsensus
        :multisig-account="account"
      />
    </template>
  </AccountCardBase>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  PropType,
} from '@vue/composition-api';
import { ROUTE_MULTISIG_DETAILS } from '../router/routeNames';
import { useFungibleTokens } from '../../composables';

import AccountInfo from './AccountInfo.vue';
import BalanceInfo from './BalanceInfo.vue';
import AccountCardConsensus from './AccountCardConsensus.vue';
import AccountCardBase from './AccountCardBase.vue';

import type { IMultisigAccount } from '../../types';

export default defineComponent({
  components: {
    AccountCardBase,
    AccountCardConsensus,
    AccountInfo,
    BalanceInfo,
  },
  props: {
    account: { type: Object as PropType<IMultisigAccount>, required: true },
    selected: Boolean,
  },
  setup(props, { root }) {
    const { loadTokenBalances } = useFungibleTokens({
      store: root.$store,
      accountAddress: props.account.gaAccountId,
    });

    onMounted(() => loadTokenBalances());

    return {
      ROUTE_MULTISIG_DETAILS,
    };
  },
});
</script>
