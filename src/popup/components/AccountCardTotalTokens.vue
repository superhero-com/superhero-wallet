<template>
  <div
    v-if="isOnline"
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
import { computed, defineComponent, PropType } from 'vue';
import { useConnection } from '../../composables';
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
    const { isOnline } = useConnection();
    const getTokenBalance = useGetter('fungibleTokens/getTokenBalance');

    const totalTokens = computed(() => getTokenBalance.value(props.currentAccount.address).length);

    return {
      isOnline,
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

    .digit {
      display: inline-block;
      margin-right: 4px;
    }

    .wording {
      opacity: 0.85;
    }
  }

  &.selected {
    opacity: 1;
  }
}
</style>
