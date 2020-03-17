<template>
  <div class="flex flex-justify-between flex-align-start mt-25">
    <Input
      class="amount-box"
      type="number"
      :error="!amountError ? false : true"
      v-model="finalAmount"
      :placeholder="$t('pages.tipPage.amountPlaceholder')"
      :label="$t('pages.tipPage.amountLabel')"
    />
    <div class="ml-15 text-left" style="margin-right:auto">
      <p class="label hidden">Empty</p>
      <span class="secondary-text f-14 block l-1" data-cy="amount"> {{ $t('pages.appVUE.aeid') }}</span>
      <span class="f-14 block l-1" data-cy="amount-currency">{{ getCurrencyAmount }} {{ currentCurrency }}</span>
    </div>
    <div class="balance-box">
      <p class="label">{{ $t('pages.tipPage.availableLabel') }}</p>
      <span class="secondary-text f-14 block l-1" data-cy="balance">{{ tokenBalance }} {{ $t('pages.appVUE.aeid') }}</span>
      <span class="f-14 block l-1" data-cy="balance-currency">{{ balanceCurrency }} {{ currentCurrency }}</span>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Input from './Input';

export default {
  components: {
    Input,
  },
  props: ['amountError', 'value'],
  data() {
    return {
      finalAmount: null,
    };
  },
  created() {
    if (this.value) this.finalAmount = this.value;
  },
  watch: {
    finalAmount(val) {
      this.$emit('changeAmount', val);
    },
    value(val) {
      this.finalAmount = val;
    },
  },
  computed: {
    ...mapGetters(['tokenBalance', 'balanceCurrency', 'current', 'currentCurrency']),
    getCurrencyAmount() {
      if (isNaN(this.finalAmount)) return '0.000';
      return (this.finalAmount * this.current.currencyRate).toFixed(3);
    },
  },
};
</script>
