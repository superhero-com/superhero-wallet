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

    <template #bottom-left>
      <AccountCardTotalTokens :account="account" />
    </template>

    <template #bottom-right>
      <Component
        :is="accountIcon"
        v-if="accountIcon"
        class="account-type-icon"
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
import PrivateKeyIcon from '../../icons/private-key.svg?vue-component';

export default defineComponent({
  components: {
    AccountCardBase,
    AccountCardTotalTokens,
    AccountInfo,
    BalanceInfo,
    AirGapIcon,
    PrivateKeyIcon,
  },
  props: {
    account: { type: Object as PropType<IAccount>, required: true },
    ...accountCardBaseCommonProps,
  },
  setup(props) {
    const { getAccountBalance } = useBalances();

    const accountIcon = computed(() => {
      switch (props.account.type) {
        case ACCOUNT_TYPES.airGap:
          return AirGapIcon;
        case ACCOUNT_TYPES.privateKey:
          return PrivateKeyIcon;
        default:
          return null;
      }
    });

    const numericBalance = computed(() => getAccountBalance(props.account.address).toNumber());

    return {
      accountIcon,
      numericBalance,
    };
  },
});
</script>

<style lang="scss" scoped>
.account-card-base {
  .account-type-icon {
    width: 20px;
    height: 20px;
    opacity: 0.85;
  }
}
</style>
