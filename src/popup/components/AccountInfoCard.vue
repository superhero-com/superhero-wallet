<template>
  <BtnPlain
    class="account-info-card"
    :style="bgColorStyle"
    @click.prevent="$emit('click')"
  >
    <div
      class="option-wrapper"
      :class="{ selected: isSelected }"
    >
      <AccountInfo
        class="account-info"
        :address="address"
        :name="name"
        :idx="idx"
        :is-air-gap="isAirGapAccount"
        avatar-size="rg"
        avatar-borderless
        is-list-name
      />
      <TokenAmount
        class="token-amount"
        :amount="accountBalance"
        :symbol="AETERNITY_SYMBOL"
        fiat-below
        small
      />
    </div>
  </BtnPlain>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
} from '@vue/composition-api';
import { getAddressColor } from '../utils/avatar';
import { AETERNITY_SYMBOL } from '../utils';

import AccountInfo from './AccountInfo.vue';
import BtnPlain from './buttons/BtnPlain.vue';
import TokenAmount from './TokenAmount.vue';
import { useBalances } from '../../composables';

export default defineComponent({
  components: {
    TokenAmount,
    AccountInfo,
    BtnPlain,
  },
  props: {
    address: { type: String, required: true },
    name: { type: String, default: '' },
    idx: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    isSelected: Boolean,
    isAirGapAccount: Boolean,
  },
  setup(props, { root }) {
    const { getAccountBalance } = useBalances({ store: root.$store });
    const bgColorStyle = computed(() => ({ '--bg-color': getAddressColor(props.address) }));

    const accountBalance = computed(
      () => props.balance || (props.address)
        ? getAccountBalance(props.address).toNumber()
        : 0,
    );

    return {
      accountBalance,
      bgColorStyle,
      AETERNITY_SYMBOL,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/mixins';

.account-info-card {
  --border-width: 3px;

  width: 100%;
  padding: 2px 8px;

  .option-wrapper {
    @include mixins.flex(space-between, flex-start, row);

    position: relative;
    padding: 8px;
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
        --border-offset: calc(var(--border-width) - 1px);

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
