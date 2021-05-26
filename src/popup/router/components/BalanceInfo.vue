<template>
  <div
    class="balance-info"
    data-cy="balance-info"
  >
    <div class="balance-wrapper">
      <div
        class="balance-dropdown"
        data-cy="tokens-dropdown"
      >
        <Dropdown
          v-if="tokenBalancesOptions.length && UNFINISHED_FEATURES"
          :options="tokenBalancesOptions"
          :method="changeToken"
          :selected="currentToken"
          is-custom
        />
        <span class="display-value text-ellipsis">
          {{ selectedToken ? selectedToken.convertedBalance : balances[idx].toFixed(2) }}
        </span>
        <span class="token-symbol">{{ !selectedToken ? $t('ae') : selectedToken.symbol }}</span>
        <Arrow
          v-if="UNFINISHED_FEATURES"
          class="expand-arrow"
        />
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
        <span class="approx-sign">~</span>
        <span class="display-value text-ellipsis">{{
          formatCurrency(balances[idx] * currentCurrencyRate)
        }}</span>
        <Arrow class="expand-arrow" />
      </div>
    </div>
  </div>
</template>

<script>
import { pick } from 'lodash-es';
import { mapGetters, mapState } from 'vuex';
import Arrow from '../../../icons/arrow.svg?vue-component';
import Dropdown from './Dropdown';

export default {
  components: {
    Arrow,
    Dropdown,
  },
  props: {
    accountIdx: { type: Number, default: -1 },
  },
  data: () => ({
    UNFINISHED_FEATURES: process.env.UNFINISHED_FEATURES,
  }),
  subscriptions() {
    return pick(this.$store.state.observables, ['balances']);
  },
  computed: {
    ...mapState(['current', 'currencies', 'accountSelectedIdx']),
    ...mapState('fungibleTokens', ['tokenBalances', 'selectedToken']),
    ...mapGetters(['formatCurrency', 'currentCurrencyRate']),
    tokenBalancesOptions() {
      return [
        {
          value: 'default',
          text: `${this.balances[this.idx].toFixed(2)} ${this.$t('ae')}`,
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
    idx() {
      return this.accountIdx === -1 ? this.accountSelectedIdx : this.accountIdx;
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
@use '../../../styles/variables';
@use '../../../styles/typography';

.balance-info {
  height: 55px;
  margin-bottom: 15px;
  display: flex;
  color: variables.$color-white;

  .balance-wrapper {
    margin: 0 auto;

    .balance-dropdown {
      margin-top: 6px;
      margin-left: auto;
      position: relative;
      width: max-content;

      .dropdown {
        position: absolute;

        ::v-deep {
          .custom > button,
          .custom > button:active:not(:disabled) {
            opacity: 0;
          }

          .custom > button,
          .custom .list .ae-button {
            @extend %face-sans-16-regular;
          }
        }
      }

      .token-symbol {
        color: variables.$color-blue;

        + .expand-arrow {
          vertical-align: middle;
        }
      }

      &.currenciesgroup {
        margin-top: 6px;

        .approx-sign {
          margin-top: 3px;
          color: variables.$color-white;
        }

        span {
          @extend %face-sans-16-regular;
        }
      }

      .display-value,
      .token-symbol {
        @extend %face-sans-20-regular;

        vertical-align: text-top;
      }

      .display-value {
        display: inline-block;
        max-width: 200px;
      }

      .expand-arrow {
        height: 16px;
        width: 16px;
        color: variables.$color-dark-grey;
      }
    }
  }
}
</style>
