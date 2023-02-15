<template>
  <BtnBase
    :class="['account-card', { selected }]"
    :to="{ name: 'account-details' }"
    :disabled="!selected"
    :bg-color="color"
    data-cy="account-card"
  >
    <div class="top">
      <AccountInfo
        :account="account"
        :color="color"
      />
    </div>

    <div class="middle">
      <BalanceInfo :account="account" />
    </div>

    <AccountCardConsensus
      v-if="isMultisigDashboard"
      :current-account="account"
    />
    <AccountCardTotalTokens
      v-else
      :current-account="account"
      :selected="selected"
    />
  </BtnBase>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from '@vue/composition-api';
import { getAddressColor } from '../utils/avatar';

import AccountInfo from './AccountInfo.vue';
import BalanceInfo from './BalanceInfo.vue';
import BtnBase from './buttons/BtnBase.vue';
import AccountCardTotalTokens from './AccountCardTotalTokens.vue';
import AccountCardConsensus from './AccountCardConsensus.vue';

import type { IAccount, IMultisigAccount } from '../../types';
import { useMultisigAccounts } from '../../composables';

export default defineComponent({
  components: {
    AccountCardConsensus,
    AccountCardTotalTokens,
    AccountInfo,
    BalanceInfo,
    BtnBase,
  },
  props: {
    account: { type: Object as PropType<IAccount | IMultisigAccount>, required: true },
    selected: Boolean,
  },
  setup(props, { root }) {
    const { isMultisigDashboard } = useMultisigAccounts({ store: root.$store });

    // TODO update this code when working on the multisig navigation
    const color = computed(() => getAddressColor(isMultisigDashboard.value
      ? (props.account as IMultisigAccount).gaAccountId
      : (props.account as IAccount).address));

    return {
      color,
      isMultisigDashboard,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';

.account-card {
  display: flex;
  flex-direction: column;
  border-radius: variables.$border-radius-card;
  margin: 8px 16px 32px 16px;
  padding: 12px;
  text-decoration: none;
  color: inherit;

  &.selected {
    .account-info,
    .middle {
      opacity: 1;
    }
  }

  .account-info,
  .middle {
    opacity: 0.5;
  }

  .middle {
    margin-top: 5px;
    text-align: center;
  }
}
</style>
