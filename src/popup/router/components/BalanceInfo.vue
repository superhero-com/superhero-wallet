<template>
  <div class="balance-info" data-cy="balance-info">
    <div class="balance-wrapper">
      <div class="balance-dropdown" data-cy="tokens-dropdown">
        <Dropdown
          v-if="tokenBalancesOptions.length"
          :options="tokenBalancesOptions"
          :method="changeToken"
          :selected="currentToken"
          is-custom
        />
        <span class="display-value text-ellipsis">
          {{ selectedToken ? selectedToken.convertedBalance : tokenBalance.toFixed(2) }}
        </span>
        <span class="token-symbol">{{ !selectedToken ? $t('ae') : selectedToken.symbol }}</span>
        <ExpandedAngleArrow class="expand-arrow" />
      </div>
      <div
        v-if="currentToken === 'default'"
        class="currenciesgroup balance-dropdown"
        data-cy="currency-dropdown"
      >
        <Dropdown
          :options="currenciesOptions"
          :method="switchCurrency"
          :selected="current.currency"
          is-custom
        />
        <!--eslint-disable-next-line vue-i18n/no-raw-text-->
        <span class="approx-sign">~</span>
        <span class="display-value text-ellipsis">{{ formatCurrency(balanceCurrency) }}</span>
        <ExpandedAngleArrow class="expand-arrow" />
      </div>
    </div>
  </div>
</template>

<script>
import { pick } from 'lodash-es';
import { mapGetters, mapState } from 'vuex';
import ExpandedAngleArrow from '../../../icons/expanded-angle-arrow.svg?vue-component';
import Dropdown from './Dropdown';

export default {
  components: {
    ExpandedAngleArrow,
    Dropdown,
  },
  subscriptions() {
    return pick(this.$store.state.observables, ['tokenBalance', 'balanceCurrency']);
  },
  computed: {
    ...mapState(['current', 'currencies']),
    ...mapState('fungibleTokens', ['tokenBalances', 'selectedToken']),
    ...mapGetters(['formatCurrency']),
    tokenBalancesOptions() {
      return [
        {
          value: 'default',
          text: `${this.tokenBalance.toFixed(2)} ${this.$t('ae')}`,
        },
        ...this.tokenBalances,
      ];
    },
    currenciesOptions() {
      return Object.keys(this.currencies).map((currencyKey) => ({
        text: currencyKey.toUpperCase(),
        value: currencyKey,
      }));
    },
    currentToken() {
      return this.selectedToken ? this.selectedToken.value : 'default';
    },
  },
  methods: {
    async switchCurrency(selectedCurrency) {
      this.$store.commit('setCurrentCurrency', selectedCurrency);
    },
    changeToken(value) {
      this.$store.commit(
        'fungibleTokens/setSelectedToken',
        value !== 'default' ? this.getSelectedToken(value) : null,
      );
    },
    getSelectedToken(changedToken) {
      return this.tokenBalances.find(({ value }) => value === changedToken) || null;
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.balance-info {
  height: 76px;
  background-image: url('../../../icons/acc_balance.png');
  border-bottom: 2px solid $transactions-bg;
  display: flex;
  padding: 0 20px 10px 20px;
  margin-top: 15px;
  color: $text-color;
  font-size: 26px;
  line-height: 34px;

  .balance-wrapper {
    margin: 0 auto;

    .balance-dropdown {
      margin-left: auto;
      position: relative;
      width: max-content;

      .dropdown {
        position: absolute;

        ::v-deep .custom > button,
        .custom > button:active:not(:disabled) {
          opacity: 0;
        }
      }

      .token-symbol {
        color: $secondary-color;
      }

      &.currenciesgroup {
        font-size: 18px;
        line-height: 24px;
        font-weight: 500;

        .approx-sign {
          margin-top: 3px;
          color: $text-color;
        }
      }

      .display-value {
        display: inline-block;
        max-width: 200px;
        vertical-align: text-top;
      }

      .expand-arrow {
        color: $gray-2;
      }
    }
  }
}
</style>
