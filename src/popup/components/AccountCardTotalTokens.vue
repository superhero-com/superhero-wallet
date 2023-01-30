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
import { useGetter } from '../../composables/vuex';
import { IAccount } from '../../types';

export default defineComponent({
  props: {
    selected: Boolean,
    currentAccount: {
      type: Object as PropType<IAccount>,
      required: true,
    },
  },
  setup(props) {
    const getTokenBalance = useGetter('fungibleTokens/getTokenBalance');

    const totalTokens = computed(() => getTokenBalance.value(props.currentAccount.address).length);

    return {
      totalTokens,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/typography';

.account-card-total-tokens {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: auto;
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
