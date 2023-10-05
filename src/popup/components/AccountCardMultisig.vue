<template>
  <AccountCardBase :selected="selected">
    <template #top>
      <AccountInfo
        :address="account.gaAccountId"
        :protocol="PROTOCOL_AETERNITY"
        is-multisig
        avatar-borderless
        with-protocol-icon
      />
    </template>

    <template #middle>
      <BalanceInfo
        :balance="+account.balance"
        :protocol="PROTOCOL_AETERNITY"
      />
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
import { PROTOCOL_AETERNITY } from '@/constants';
import { useMultisigAccounts } from '@/composables';

import AccountInfo from './AccountInfo.vue';
import BalanceInfo from './BalanceInfo.vue';
import AccountCardConsensus from './AccountCardConsensus.vue';
import AccountCardBase from './AccountCardBase.vue';
import AccountCardSyncing from './AccountCardSyncing.vue';

import type { IMultisigAccount } from '../../types';

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
      PROTOCOL_AETERNITY,
      isPendingAccount,
    };
  },
});
</script>
