<template>
  <div class="ae-balance">
    <span class="token-symbol">Æ </span>
    <span class="token-integer">{{ `${integerPart}.` }}</span>
    <span class="token-fractional">{{ fractionalPart }}</span>
  </div>
</template>

<script>
export default {
  props: {
    balance: { type: Number, default: 0 },
  },
  computed: {
    integerPart() {
      return Math.trunc(this.balance).toLocaleString();
    },
    fractionalPart() {
      return (Math.trunc((this.balance % 1) * 100));
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
