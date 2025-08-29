<template>
  <div
    v-if="hasTokensSupport && isOnline"
    class="account-card-total-tokens"
  >
    <div class="total-tokens">
      <span class="digit">
        {{ totalTokens }}
      </span>
      <span class="wording">
        {{ $t('pages.fungible-tokens.tokens', totalTokens) }}
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import type { IAccount } from '@/types';
import { useConnection, useFungibleTokens } from '@/composables';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

export default defineComponent({
  props: {
    account: { type: Object as PropType<IAccount>, required: true },
  },
  setup(props) {
    const { isOnline } = useConnection();
    const { getAccountTokenBalances } = useFungibleTokens();

    const adapter = ProtocolAdapterFactory.getAdapter(props.account.protocol);

    const { hasTokensSupport } = adapter;

    const totalTokens = computed(
      () => getAccountTokenBalances(props.account.address, props.account.protocol).length,
    );

    return {
      isOnline,
      hasTokensSupport,
      totalTokens,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/typography';
@use '@/styles/variables' as *;

.account-card-total-tokens {
  width: 100%;

  .total-tokens {
    @extend %face-sans-14-medium;

    color: $color-white;
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
