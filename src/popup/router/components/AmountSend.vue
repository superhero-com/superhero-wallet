<template>
  <!-- TODO: Rename the root class to "amount-send" -->
  <div class="amount-send-container">
    <div class="amount-send">
      <Input
        class="amount-box"
        type="number"
        :error="amountError || value < 0"
        :value="value"
        :placeholder="$t('pages.tipPage.amountPlaceholder')"
        :label="label || $t('pages.tipPage.amountLabel')"
        @input="$emit('input', $event)"
      />
      <div class="ml-15 text-left" style="margin-right: auto;">
        <p class="label hidden">{{ $t('pages.tipPage.empty') }}</p>
        <span class="secondary-text f-14 block l-1" data-cy="amount">
          {{ $t('pages.appVUE.aeid') }}
        </span>
        <span class="f-14 block l-1 amount-currency" data-cy="amount-currency">
          {{ formatCurrency(currencyAmount) }}
        </span>
      </div>
      <div class="balance-box">
        <p class="label">{{ $t('pages.tipPage.availableLabel') }}</p>
        <span class="secondary-text f-14 block l-1" data-cy="balance">
          {{ tokenBalance }} {{ $t('pages.appVUE.aeid') }}
        </span>
        <span class="f-14 block l-1 amount-currency" data-cy="balance-currency">
          {{ formatCurrency(balanceCurrency) }}
        </span>
      </div>
    </div>
    <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Input from './Input';

export default {
  components: {
    Input,
  },
  props: ['amountError', 'value', 'errorMsg', 'label'],
  computed: {
    ...mapGetters(['tokenBalance', 'balanceCurrency', 'formatCurrency']),
    currencyAmount() {
      return ((this.value || 0) * this.$store.getters.currentCurrencyRate).toFixed(2);
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';

.amount-send-container {
  margin-bottom: 22px;
  margin-top: 25px;

  .amount-send {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    input.input {
      margin-bottom: 0;
    }

    .amount-currency {
      color: $text-color;
    }

    .balance-box,
    .amount-box {
      color: $white-color;
    }
  }

  .error-msg {
    font-weight: normal;
    color: $input-error-color !important;
    font-size: 12px;
    word-break: break-word;
    margin-top: 10px;
    text-align: left;
  }
}
</style>
