<template>
  <BtnPlain
    class="account-select-options-item"
    :style="bgColorStyle"
    @click.prevent="$emit('click')"
  >
    <div
      class="option-wrapper"
      :class="{ selected: account.address === value }"
    >
      <AccountInfo
        :address="account.address"
        :name="account.name"
        :idx="account.idx"
        avatar-size="rg"
        avatar-borderless
        is-list-name
        class="account-info"
      />
      <TokenAmount
        :amount="balance"
        :symbol="AE_SYMBOL"
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
import { useStore } from 'vuex';
import type { IFormSelectOption } from '@/types';
import { useBalances } from '@/composables';
import { getAddressColor } from '@/popup/utils/avatar';
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
    account: {
      type: Object as PropType<IFormSelectOption>,
      default: () => {},
    },
    value: { type: [String, Number], default: null },
  },
  setup(props) {
    const store = useStore();
    const { getAccountBalance } = useBalances({ store });

    const bgColorStyle = computed(() => ({ '--bg-color': getAddressColor(props.account.address) }));

    const balance = computed(
      () => (props.account?.address)
        ? getAccountBalance(props.account.address).toNumber()
        : 0,
    );

    return {
      balance,
      bgColorStyle,
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
