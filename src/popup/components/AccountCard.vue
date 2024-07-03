<template>
  <AccountCardBase
    class="account-card"
    :selected="selected"
    :address="account.address"
  >
    <template #top>
      <AccountInfo
        :account="account"
        avatar-borderless
        show-protocol-icon
      />
    </template>

    <template #middle>
      <BalanceInfo
        :balance="numericBalance"
        :protocol="account.protocol"
      />
    </template>

    <template #bottom>
      <AccountCardTotalTokens
        :account="account"
      />
      <AirGapIcon
        v-if="isAccountAirGap"
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
} from 'vue';
import type { IAccount } from '@/types';
import { useBalances } from '@/composables';
import { ACCOUNT_TYPES } from '@/constants';

import AccountInfo from './AccountInfo.vue';
import BalanceInfo from './BalanceInfo.vue';
import AccountCardTotalTokens from './AccountCardTotalTokens.vue';
import AccountCardBase, { accountCardBaseCommonProps } from './AccountCardBase.vue';

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
    ...accountCardBaseCommonProps,
  },
  setup(props) {
    const { getAccountBalance } = useBalances();

    const numericBalance = computed(() => getAccountBalance(props.account.address).toNumber());

    const isAccountAirGap = computed((): boolean => props.account.type === ACCOUNT_TYPES.airGap);

    return {
      numericBalance,
      isAccountAirGap,
    };
  },
});
</script>

<style lang="scss" scoped>
.account-card-base .air-gap-icon {
  width: 24px;
  height: 24px;
}
</style>
