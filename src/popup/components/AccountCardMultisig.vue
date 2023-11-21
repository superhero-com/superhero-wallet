<template>
  <AccountCardBase :selected="selected">
    <template #top>
      <AccountInfo
        :account="convertMultisigAccountToAccount(account)"
        is-multisig
        avatar-borderless
        show-protocol-icon
      />
    </template>

    <template #middle>
      <BalanceInfo
        :balance="+account.balance"
        :protocol="PROTOCOLS.aeternity"
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
import type { IMultisigAccount } from '@/types';
import { PROTOCOLS } from '@/constants';
import { useMultisigAccounts } from '@/composables';
import { convertMultisigAccountToAccount } from '@/protocols/aeternity/helpers';

import AccountInfo from './AccountInfo.vue';
import BalanceInfo from './BalanceInfo.vue';
import AccountCardConsensus from './AccountCardConsensus.vue';
import AccountCardBase from './AccountCardBase.vue';
import AccountCardSyncing from './AccountCardSyncing.vue';

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
    const { pendingMultisigAccounts } = useMultisigAccounts();

    const isPendingAccount = computed(
      () => !!pendingMultisigAccounts.value.find(
        ({ gaAccountId }) => gaAccountId === props.account.gaAccountId,
      ),
    );

    return {
      PROTOCOLS,
      isPendingAccount,
      convertMultisigAccountToAccount,
    };
  },
});
</script>
