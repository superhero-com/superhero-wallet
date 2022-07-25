<template>
  <div
    class="balance-info"
    data-cy="balance-info"
  >
    <div class="balance-wrapper">
      <Dropdown
        v-if="tokenBalancesOptions.length"
        :options="tokenBalancesOptions"
        :method="changeToken"
        data-cy="tokens-dropdown"
      >
        <template slot="display">
          <span class="display-value">
            {{ selectedToken ? selectedToken.convertedBalance : balances[idx].toFixed(2) }}
          </span>
          <span class="token-symbol">{{ !selectedToken ? $t('ae') : selectedToken.symbol }}</span>
          <Arrow class="expand-arrow" />
        </template>
      </Dropdown>
      <Dropdown
        v-if="currentToken === 'default'"
        :options="currenciesOptions"
        :method="switchCurrency"
        class="currenciesgroup"
        data-cy="currency-dropdown"
      >
        <template slot="display">
          <span class="approx-sign">≈</span>
          <span class="display-value">
            {{ formatCurrency(balances[idx] * currentCurrencyRate) }}
          </span>
          <Arrow class="expand-arrow" />
        </template>
      </Dropdown>
    </div>
  </div>
</template>

<script>
import { pick } from 'lodash-es';
import { mapGetters, mapState } from 'vuex';
import Arrow from '../../../icons/arrow.svg?vue-component';
import Dropdown from './Dropdown.vue';

export default {
  components: {
    Arrow,
    Dropdown,
  },
  props: {
    accountIdx: { type: Number, default: -1 },
  },
  subscriptions() {
    return pick(this.$store.state.observables, ['balances']);
  },
  computed: {
    ...mapState('accounts', ['activeIdx']),
    ...mapState(['current', 'currencies']),
    ...mapGetters('fungibleTokens', ['getTokenBalance', 'getSelectedToken']),
    ...mapGetters(['formatCurrency', 'currentCurrencyRate', 'accounts']),
    tokenBalancesOptions() {
      return [
        {
          value: 'default',
          text: `${this.balances[this.idx].toFixed(2)} ${this.$t('ae')}`,
        },
        ...this.tokenBalances.filter((b) => +b?.convertedBalance),
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
      return this.accountIdx === -1 ? this.activeIdx : this.accountIdx;
    },
    tokenBalances() {
      return this.getTokenBalance(this.accounts[this.idx].address);
    },
    selectedToken() {
      return this.getSelectedToken(this.accounts[this.idx].address);
    },
  },
  methods: {
    async switchCurrency(selectedCurrency) {
      this.$store.commit('setCurrentCurrency', selectedCurrency);
    },
    changeToken(token) {
      this.$store.commit('fungibleTokens/setSelectedToken', {
        address: this.accounts[this.idx].address,
        token: token !== 'default' ? this.tokenBalances.find(({ value }) => value === token) : null,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.balance-info {
  height: 55px;
  display: flex;

  .balance-wrapper {
    margin: 0 auto;

    .dropdown {
      margin-top: 6px;
      text-align: end;

      &:only-child {
        text-align: center;
      }

      &.currenciesgroup {
        .approx-sign {
          margin-top: 3px;
          color: variables.$color-white;
        }

        span {
          @extend %face-sans-16-regular;
        }
      }

      ::v-deep {
        .content {
          display: flex;
          flex-direction: column;
          align-items: center;
          background-color: transparent;
        }

        .list .button-plain {
          @extend %face-sans-16-regular;
        }
      }

      .token-symbol {
        color: variables.$color-blue;

        + .expand-arrow {
          vertical-align: middle;
        }
      }

      .display-value,
      .token-symbol {
        @extend %face-sans-20-regular;

        vertical-align: text-top;
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
