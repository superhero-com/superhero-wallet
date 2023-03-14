<template>
  <AccountCardBase
    class="account-card"
    :selected="selected"
  >
    <template #top>
      <AccountInfo
        :address="account.address"
        :name="account.name"
        :idx="account.idx"
        :is-air-gap="isAirGapAccount"
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
      <AirGapIcon
        v-if="isAirGapAccount"
        class="air-gap-icon"
      />
    </template>
  </AccountCardBase>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
} from '@vue/composition-api';
import type { IAccount } from '../../types';
import { ROUTE_ACCOUNT_DETAILS } from '../router/routeNames';
import { useBalances } from '../../composables';
import { ACCOUNT_AIR_GAP_WALLET } from '../utils';

import AccountInfo from './AccountInfo.vue';
import BalanceInfo from './BalanceInfo.vue';
import AccountCardTotalTokens from './AccountCardTotalTokens.vue';
import AccountCardBase from './AccountCardBase.vue';

import AirGapIcon from '../../icons/air-gap.svg?vue-component';

export default defineComponent({
  components: {
    AccountCardBase,
    AccountCardTotalTokens,
    AccountInfo,
    BalanceInfo,
    AirGapIcon,
  },
  props: {
    account: { type: Object as PropType<IAccount>, required: true },
    selected: Boolean,
  },
  setup(props, { root }) {
    const { balance } = useBalances({ store: root.$store });

    const numericBalance = computed<number>(() => balance.value.toNumber());
    const isAirGapAccount = computed((): boolean => props.account.type === ACCOUNT_AIR_GAP_WALLET);

    return {
      numericBalance,
      isAirGapAccount,
      ROUTE_ACCOUNT_DETAILS,
    };
  },
});
</script>

<style lang="scss" scoped>
.account-card-base {
  .air-gap-icon {
    width: 24px;
    height: 24px;
  }
}
</style>
