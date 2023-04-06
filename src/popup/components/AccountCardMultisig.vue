<template>
  <AccountCardBase :selected="selected">
    <template #top>
      <AccountInfo
        :address="account.gaAccountId"
        is-multisig
        avatar-borderless
      />
    </template>

    <template #middle>
      <BalanceInfo :balance="+account.balance" />
    </template>

    <template #bottom>
      <AccountCardSyncing v-if="isPendingAccount" />

      <AccountCardConsensus
        v-else
        :multisig-account="account"
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
import { useStore } from 'vuex';
import { ROUTE_MULTISIG_DETAILS } from '../router/routeNames';

import AccountInfo from './AccountInfo.vue';
import BalanceInfo from './BalanceInfo.vue';
import AccountCardConsensus from './AccountCardConsensus.vue';
import AccountCardBase from './AccountCardBase.vue';
import AccountCardSyncing from './AccountCardSyncing.vue';

import type { IMultisigAccount } from '../../types';
import { useMultisigAccounts } from '../../composables';

export default defineComponent({
  components: {
    AccountCardSyncing,
    AccountCardBase,
    AccountCardConsensus,
    AccountInfo,
    BalanceInfo,
  },
  props: {
    account: { type: Object as PropType<IMultisigAccount>, required: true },
    selected: Boolean,
  },
  setup(props) {
    const store = useStore();

    const { pendingMultisigAccounts } = useMultisigAccounts({ store });

    const isPendingAccount = computed(
      () => !!pendingMultisigAccounts.value.find(
        ({ gaAccountId }) => gaAccountId === props.account.gaAccountId,
      ),
    );

    return {
      isPendingAccount,
      ROUTE_MULTISIG_DETAILS,
    };
  },
});
</script>
