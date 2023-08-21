<template>
  <div class="ae-balance">
    <span class="token-symbol">&aelig;</span>
    <span class="token-integer">{{ balanceParts.integer }}.</span>
    <span class="token-fractional">{{ balanceParts.fraction }}</span>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';

export default defineComponent({
  props: {
    balance: { type: Number, default: 0 },
  },
  setup(props) {
    const balanceParts = computed(() => {
      const [integer, fraction] = props.balance.toFixed(2).split('.');
      return {
        integer: Number(integer).toLocaleString(),
        fraction,
      };
    });

    return {
      balanceParts,
    };
  },
});
</script>

<style lang="scss">
@use '../../styles/typography';
@use '../../styles/variables';

.ae-balance {
  display: flex;
  align-items: baseline;

  .token-symbol {
    @extend %face-sans-24-semi-bold;

    color: variables.$color-white;
    margin-right: 4px;
    text-transform: uppercase;
  }

  .token-integer {
    @extend %face-sans-30-semi-bold;

    color: variables.$color-white;
  }

  .token-fractional {
    @extend %face-sans-24-semi-bold;

    color: rgba(variables.$color-white, 0.75);
    opacity: 0.75;
  }

  .token-symbol,
  .token-integer,
  .token-fractional {
    line-height: 32px;
  }
}
</style>
