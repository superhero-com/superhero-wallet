<template>
  <AccountCardBase
    :address="account.address"
    :selected="selected"
    :to="{ name: ROUTE_ACCOUNT_DETAILS }"
  >
    <template #top="{ color }">
      <AccountInfo
        :address="account.address"
        :name="account.name"
        :idx="account.idx"
        :color="color"
      />
    </template>

    <template #middle>
      <BalanceInfo :balance="numericBalance" />
    </template>

    <template #bottom>
      <AccountCardTotalTokens
        :current-account="account"
        :selected="selected"
      />
    </template>
  </AccountCardBase>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  PropType,
  watch,
} from '@vue/composition-api';

import AccountInfo from './AccountInfo.vue';
import BalanceInfo from './BalanceInfo.vue';
import AccountCardTotalTokens from './AccountCardTotalTokens.vue';
import AccountCardBase from './AccountCardBase.vue';

import type { IAccount } from '../../types';
import { ROUTE_ACCOUNT_DETAILS } from '../router/routeNames';
import { useBalances, useFungibleTokens } from '../../composables';

export default defineComponent({
  components: {
    AccountCardBase,
    AccountCardTotalTokens,
    AccountInfo,
    BalanceInfo,
  },
  props: {
    account: { type: Object as PropType<IAccount>, required: true },
    selected: Boolean,
  },
  setup(props, { root }) {
    const { loadTokenBalances } = useFungibleTokens({
      store: root.$store,
      accountAddress: props.account.address,
    });
    const { balance } = useBalances({ store: root.$store });

    const numericBalance = computed<number>(() => balance.value.toNumber());

    watch(
      () => props.selected,
      (selected) => selected && loadTokenBalances(),
      { immediate: true },
    );

    return {
      numericBalance,
      ROUTE_ACCOUNT_DETAILS,
    };
  },
});
</script>
