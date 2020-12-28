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
      <div class="ml-15 text-left">
        <p class="label hidden">{{ $t('pages.tipPage.empty') }}</p>
        <span class="secondary-text f-14 block l-1" data-cy="amount">
          {{ selectedToken ? selectedToken.symbol : $t('ae') }}
        </span>
        <span class="f-14 block l-1 amount-currency" data-cy="amount-currency">
          {{ selectedToken ? formatCurrency(0) : formatCurrency(currencyAmount) }}
        </span>
      </div>
      <div class="balance-box">
        <p class="label">{{ $t('pages.tipPage.availableLabel') }}</p>
        <span class="secondary-text f-14 block l-1" data-cy="balance">
          {{ selectedToken ? selectedToken.convertedBalance : tokenBalance.toFixed(2) }}
          {{ selectedToken ? selectedToken.symbol : $t('ae') }}
        </span>
        <span class="f-14 block l-1 amount-currency" data-cy="balance-currency">
          {{ selectedToken ? formatCurrency(0) : formatCurrency(balanceCurrency) }}
        </span>
      </div>
    </div>
    <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
  </div>
</template>

<script>
import { pick } from 'lodash-es';
import { mapGetters, mapState } from 'vuex';
import Input from './Input';

export default {
  components: {
    Input,
  },
  props: ['amountError', 'value', 'errorMsg', 'label'],
  subscriptions() {
    return pick(this.$store.state.observables, ['tokenBalance', 'balanceCurrency']);
  },
  computed: {
    ...mapGetters(['formatCurrency']),
    ...mapState('fungibleTokens', ['selectedToken']),
    currencyAmount() {
      return ((this.value || 0) * this.$store.getters.currentCurrencyRate).toFixed(2);
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.amount-send-container {
  margin-bottom: 22px;
  margin-top: 25px;

  .amount-send {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    .ml-15.text-left {
      margin-right: auto;
    }

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

    .ml-15,
    .balance-box {
      .label {
        font-size: 14px;
        margin: 4px 0;
        display: block;
        font-weight: normal;
      }
    }
  }

  .error-msg {
    font-weight: normal;
    color: $input-error-color;
    font-size: 12px;
    word-break: break-word;
    margin-top: 10px;
    text-align: left;
  }
}
</style>
