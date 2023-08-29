<template>
  <div
    v-if="isOnline"
    class="account-card-total-tokens"
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
import { IAccount } from '@/types';
import { useConnection } from '@/composables';
import { useGetter } from '@/composables/vuex';

export default defineComponent({
  props: {
    currentAccount: { type: Object as PropType<IAccount>, required: true },
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
}
</style>
