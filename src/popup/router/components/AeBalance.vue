<template>
  <div class="ae-balance">
    <span class="token-symbol">Æ </span>
    <span class="token-integer">{{ balanceParts.integer }}.</span>
    <span class="token-fractional">{{ balanceParts.fraction }}</span>
  </div>
</template>

<script>
export default {
  props: {
    balance: { type: Number, default: 0 },
  },
  computed: {
    balanceParts() {
      const [integer, fraction] = this.balance.toFixed(2).split('.');
      return {
        integer: Number(integer).toLocaleString(),
        fraction,
      };
    },
  },
};
</script>

<style lang="scss">
@use '../../../styles/typography';
@use '../../../styles/variables';

.ae-balance {
  display: flex;
  align-items: baseline;

  .token-symbol {
    @extend %face-sans-24-medium;

    color: variables.$color-white;
    margin-right: 4px;
  }

  .token-integer {
    @extend %face-sans-30-medium;

    color: variables.$color-white;
  }

  .token-fractional {
    @extend %face-sans-24-medium;

    color: rgba(variables.$color-white, 0.75);
    line-height: 32px;
    opacity: 0.75;
  }
}
</style>
