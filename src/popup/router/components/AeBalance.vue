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

.ae-balance {
  display: flex;
  align-items: baseline;

  .token-symbol {
    @extend %face-sans-24-bold;

    margin-right: 4px;
  }

  .token-integer {
    @extend %face-sans-30-bold;
  }

  .token-fractional {
    @extend %face-sans-24-bold;

    line-height: 32px;
    opacity: 0.75;
  }
}
</style>
