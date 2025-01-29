<template>
  <component
    :is="(clickable) ? 'BtnPlain' : 'div'"
    v-if="account"
    class="account-select-options-item"
    :style="bgColorStyle"
  >
    <div
      class="option-wrapper"
      :class="{ selected, clickable }"
    >
      <AccountInfo
        :account="account"
        class="account-info"
        avatar-size="rg"
        is-list-name
        :show-protocol-icon="!hideProtocolIcon"
      >
        <template #after-address>
          <slot name="after-address" />
        </template>
      </AccountInfo>
      <TokenAmount
        v-if="!hideBalance"
        :amount="balance"
        :symbol="tokenSymbol"
        :protocol="account.protocol"
        class="token-amount"
        vertical
        small
      />
      <slot
        v-if="$slots.right"
        name="right"
      />
    </div>
  </component>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
} from 'vue';
import type { IAccount, IFormSelectOption } from '@/types';
import { useAccounts, useBalances } from '@/composables';
import { getAddressColor } from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import { AE_SYMBOL } from '@/protocols/aeternity/config';

import AccountInfo from './AccountInfo.vue';
import BtnPlain from './buttons/BtnPlain.vue';
import TokenAmount from './TokenAmount.vue';

export default defineComponent({
  components: {
    TokenAmount,
    AccountInfo,
    BtnPlain,
  },
  props: {
    option: {
      type: Object as PropType<IFormSelectOption>,
      default: () => ({}),
    },
    customAccount: {
      type: Object as PropType<IAccount>,
      default: null,
    },
    outsideBalance: {
      type: Number,
      default: 0,
    },
    selected: Boolean,
    hideBalance: Boolean,
    hideProtocolIcon: Boolean,
    clickable: Boolean,
  },
  setup(props) {
    const { getAccountBalance } = useBalances();
    const { getAccountByAddress } = useAccounts();

    const account = computed(() => (
      props.customAccount ?? getAccountByAddress(props.option.value as string)
    ));

    const bgColorStyle = computed(() => ({ '--bg-color': getAddressColor(account.value.address) }));

    const balance = computed(() => {
      switch (true) {
        case !!props.outsideBalance:
          return props.outsideBalance;
        case !!account.value:
          return getAccountBalance(account.value.address.toString()).toNumber();
        default:
          return 0;
      }
    });

    const tokenSymbol = computed(
      () => ProtocolAdapterFactory.getAdapter(account.value.protocol).coinSymbol,
    );

    return {
      account,
      balance,
      bgColorStyle,
      tokenSymbol,
      AE_SYMBOL,
    };
  },
});
</script>

<style lang="scss" scoped>
.account-select-options-item {
  --border-width: 2px;

  width: 100%;

  .option-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 8px;
    border-radius: 10px;
    width: 100%;
    border: var(--border-width) solid var(--bg-color);
    background-color: var(--bg-color);
    gap: 4px;

    &.clickable:hover:not(.selected) {
      background-color: color-mix(in srgb, var(--bg-color) 80%, transparent);
    }

    &.selected {
      background-color: color-mix(in srgb, var(--bg-color) 40%, transparent);
      transition: background-color 0.12s ease-in-out;
    }

    .account-info {
      min-width: 0;
      width: 100%;
    }

    .token-amount {
      text-align: right;
    }
  }
}
</style>
