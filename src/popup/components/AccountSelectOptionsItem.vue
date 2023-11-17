<template>
  <BtnPlain
    v-if="account"
    class="account-select-options-item"
    :style="bgColorStyle"
    @click.prevent="$emit('click')"
  >
    <div
      class="option-wrapper"
      :class="{ selected }"
    >
      <AccountInfo
        :account="account"
        avatar-size="rg"
        avatar-borderless
        is-list-name
        class="account-info"
      />
      <TokenAmount
        :amount="balance"
        :symbol="tokenSymbol"
        :protocol="account.protocol"
        fiat-below
        class="token-amount"
        small
      />
    </div>
  </BtnPlain>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
} from 'vue';
import type { IFormSelectOption } from '@/types';
import { useAccounts, useBalances } from '@/composables';
import { getAddressColor } from '@/utils';
import { AE_SYMBOL } from '@/protocols/aeternity/config';

import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
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
    selected: Boolean,
  },
  setup(props) {
    const { getAccountBalance } = useBalances();
    const { getAccountByAddress } = useAccounts();

    const account = getAccountByAddress(props.option.value as any);

    const bgColorStyle = computed(() => ({ '--bg-color': getAddressColor(props.option.value) }));

    const balance = computed(
      () => (props.option?.value)
        ? getAccountBalance(props.option.value as string).toNumber()
        : 0,
    );

    const tokenSymbol = computed(
      () => ProtocolAdapterFactory
        .getAdapter(account!.protocol)
        .coinSymbol,
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
@use '../../styles/mixins';

.account-select-options-item {
  --border-width: 3px;

  width: 100%;
  padding: 2px 8px;

  .option-wrapper {
    @include mixins.flex(space-between, flex-start, row);

    position: relative;
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
      transition: background-color 0.12s ease-in-out;
    }

    &:hover:not(.selected) {
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
