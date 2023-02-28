<template>
  <div
    class="account-card-total-tokens"
    :class="{ selected }"
  >
    <div class="total-tokens">
      <span class="digit">
        {{ totalTokens }}
      </span>
      <span class="wording">
        {{ $t('pages.fungible-tokens.tokens') }}
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from '@vue/composition-api';
import { useFungibleTokens } from '../../composables';
import { IAccount } from '../../types';

export default defineComponent({
  props: {
    selected: Boolean,
    currentAccount: {
      type: Object as PropType<IAccount>,
      required: true,
    },
  },
  setup(props, { root }) {
    const { tokenBalances } = useFungibleTokens({
      store: root.$store,
      accountAddress: props.currentAccount.address,
    });

    const totalTokens = computed(() => tokenBalances.value.length);

    return {
      totalTokens,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/typography';

.account-card-total-tokens {
  width: 100%;
  opacity: 0.5;

  .total-tokens {
    @extend %face-sans-14-medium;

    line-height: 16px;

    .wording {
      opacity: 0.85;
    }
  }

  &.selected {
    opacity: 1;
  }
}
</style>
