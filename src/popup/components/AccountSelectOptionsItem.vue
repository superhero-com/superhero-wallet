<template>
  <component
    :is="(clickable) ? 'BtnPlain' : 'div'"
    v-if="account"
    class="account-select-options-item"
    :style="bgColorStyle"
    @click.prevent="$emit('click')"
  >
    <div
      class="option-wrapper"
      :class="{ selected, clickable }"
    >
      <AccountInfo
        :account="account"
        class="account-info"
        avatar-size="rg"
        avatar-borderless
        is-list-name
        :show-protocol-icon="!hideProtocolIcon"
      />
      <TokenAmount
        v-if="!hideBalance"
        :amount="balance"
        :symbol="tokenSymbol"
        :protocol="account.protocol"
        class="token-amount"
        vertical
        small
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

    const account = props.customAccount ?? getAccountByAddress(props.option.value as string);

    const bgColorStyle = computed(() => ({ '--bg-color': getAddressColor(account.address) }));

    const balance = computed(() => {
      switch (true) {
        case !!props.outsideBalance:
          return props.outsideBalance;
        case !!account:
          return getAccountBalance(account.address.toString()).toNumber();
        default:
          return 0;
      }
    });

    const tokenSymbol = computed(
      () => ProtocolAdapterFactory.getAdapter(account!.protocol).coinSymbol,
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
  --border-width: 3px;

  width: 100%;

  .option-wrapper {
    position: relative;
    z-index: +1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 8px;
    border-radius: 10px;
    width: 100%;

    &::before {
      top: 0;
      left: 0;
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      z-index: -1;
      background-color: var(--bg-color);
      border: var(--border-width) solid var(--bg-color);
      box-sizing: border-box;
      border-radius: 10px;
      transition: all 0.12s ease-in-out;
    }

    &.clickable:hover:not(.selected) {
      &::before {
        opacity: 0.8;
      }
    }

    &.selected {
      background-color: transparent;
      border: var(--border-width) solid var(--bg-color);
      transition: background-color 0.12s ease-in-out;

      &::before {
        --border-offset: calc(var(--border-width) - 2px);

        opacity: 0.4;
        border-color: transparent;
        border-radius: 5px;
        top: var(--border-offset);
        left: var(--border-offset);
        width: calc(100% - 2 * var(--border-offset));
        height: calc(100% - 2 * var(--border-offset));
      }
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
