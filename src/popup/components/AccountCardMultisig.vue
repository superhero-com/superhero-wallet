<template>
  <AccountCardBase :selected="selected">
    <template #top>
      <AccountInfo
        :address="account.gaAccountId"
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
  PropType,
} from '@vue/composition-api';
import { ROUTE_MULTISIG_DETAILS } from '../router/routeNames';

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
  setup() {
    return {
      ROUTE_MULTISIG_DETAILS,
    };
  },
});
</script>
