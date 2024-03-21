<template>
  <AccountCardBase
    class="account-card-multisig"
    :selected="selected"
    :pending="pending"
    :address="account.gaAccountId"
  >
    <template #top>
      <AccountInfo
        :account="convertMultisigAccountToAccount(account)"
        :is-placeholder="pending"
        is-multisig
        avatar-borderless
        show-protocol-icon
      >
        <template v-if="pending" #address>
          <div class="pending">
            <PendingIcon class="pending-icon" />
            <span
              class="pending-message"
              v-text="$t('modals.creatingMultisigAccount.addingToWalletCard')"
            />
          </div>
        </template>
      </AccountInfo>
    </template>

    <template #middle>
      <BalanceInfo
        :balance="+account.balance"
        :protocol="PROTOCOLS.aeternity"
      />
    </template>

    <template #bottom>
      <AccountCardConsensus
        v-if="!pending"
        :multisig-account="account"
      />
    </template>
  </AccountCardBase>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
} from 'vue';
import type { IMultisigAccount } from '@/types';
import { PROTOCOLS } from '@/constants';
import { convertMultisigAccountToAccount } from '@/protocols/aeternity/helpers';

import AccountInfo from './AccountInfo.vue';
import BalanceInfo from './BalanceInfo.vue';
import AccountCardConsensus from './AccountCardConsensus.vue';
import AccountCardBase, { accountCardBaseCommonProps } from './AccountCardBase.vue';

import PendingIcon from '../../icons/animated-pending.svg?vue-component';

export default defineComponent({
  components: {
    AccountCardBase,
    AccountCardConsensus,
    AccountInfo,
    BalanceInfo,
    PendingIcon,
  },
  props: {
    account: { type: Object as PropType<IMultisigAccount>, required: true },
    ...accountCardBaseCommonProps,
  },
  setup() {
    return {
      PROTOCOLS,
      convertMultisigAccountToAccount,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/typography';

.account-card-multisig {
  .pending {
    display: flex;
    align-items: center;

    .pending-icon {
      height: 16px;
      width: 16px;
      margin-right: 4px;
    }

    .pending-message {
      @extend %face-sans-14-medium;

      opacity: 0.85;
    }
  }
}
</style>
