<template>
  <div class="external-svg" data-cy="balance-info">
    <div class="balance no-sign">
      <div class="amount">
        <div class="balance-dropdown" data-cy="tokens-dropdown">
          <Dropdown
            v-if="tokenBalancesOptions.length"
            :options="tokenBalancesOptions"
            :method="changeToken"
            :selected="token"
            is-custom
          />
          <span class="display-value text-ellipsis">{{
            Object.keys(selectedToken).length ? selectedToken.convertedBalance : tokenBalance
          }}</span>
          <span class="token-symbol">{{
            !Object.keys(selectedToken).length ? $t('pages.appVUE.aeid') : selectedToken.symbol
          }}</span>
          <ExpandedAngleArrow class="expand-arrow" />
        </div>
        <div v-if="token === 'default'" class="currenciesgroup">
          <div class="balance-dropdown" data-cy="currency-dropdown">
            <Dropdown
              :options="currenciesOptions"
              :method="switchCurrency"
              :selected="currency ? current.currency : currency"
              is-custom
            />
            <!--eslint-disable-next-line vue-i18n/no-raw-text-->
            <span class="approx-sign">~</span>
            <span class="display-value text-ellipsis">{{ formatCurrency(balanceCurrency) }}</span>
            <ExpandedAngleArrow class="expand-arrow" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import ExpandedAngleArrow from '../../../icons/expanded-angle-arrow.svg?vue-component';
import Dropdown from './Dropdown';

export default {
  components: {
    ExpandedAngleArrow,
    Dropdown,
  },
  data() {
    return {
      currency: '',
      token: 'default',
    };
  },
  computed: {
    ...mapState(['current', 'currencies']),
    ...mapState('fungibleTokens', ['tokenBalances', 'selectedToken']),
    ...mapGetters(['tokenBalance', 'balanceCurrency', 'formatCurrency']),
    tokenBalancesOptions() {
      return [
        {
          value: 'default',
          text: `${this.tokenBalance} ${this.$t('pages.appVUE.aeid')}`,
        },
        ...this.tokenBalances,
      ];
    },
    currenciesOptions() {
      return Object.keys(this.currencies).map(currencyKey => ({
        text: currencyKey.toUpperCase(),
        value: currencyKey,
      }));
    },
  },
  created() {
    this.token = Object.keys(this.selectedToken).length ? this.selectedToken.value : 'default';
  },
  methods: {
    async switchCurrency(selectedCurrency) {
      this.$store.commit('setCurrentCurrency', selectedCurrency);
    },
    changeToken(value) {
      this.token = value;
      this.$store.commit(
        'fungibleTokens/setSelectedToken',
        value !== 'default' ? this.getSelectedToken() : {},
      );
    },
    getSelectedToken() {
      return this.tokenBalances.find(({ value }) => value === this.token) || {};
    },
  },
};
</script>

<style lang="scss">
@import '../../../common/variables';

.currenciesgroup {
  font-size: 18px;
  display: flex;
  line-height: 24px;
  font-weight: 500;

  .approx-sign {
    margin-top: 3px;
    color: $text-color;
  }

  .balance-dropdown {
    margin-left: auto;
  }
}

.balance-dropdown {
  position: relative;

  .dropdown {
    position: absolute;
    left: 0;
  }

  .custom > button,
  .custom > button:active:not(:disabled) {
    opacity: 0;
  }

  .token-symbol {
    color: $secondary-color;
  }

  :last-child {
    vertical-align: middle;
  }
}

.display-value {
  display: inline-block;
  max-width: 200px;
  vertical-align: text-top;
}

.tour__step1:not(.v-tour__target--highlighted) .external-svg {
  z-index: 5;
}

.external-svg {
  height: 76px;
  position: relative;
  text-align: center;
  background-image: url('../../../icons/acc_balance.png');
  border-bottom: 2px solid $transactions-bg;
  display: flex;
  padding: 0 20px 10px 20px;
  margin-top: 15px;

  .balance {
    font-size: 26px;
    color: $white-color;
    font-weight: normal;
    text-align: right;
    line-height: 34px;
    margin: 0 auto;

    .amount {
      color: $text-color;
    }
  }
}

.expand-arrow {
  color: $gray-2;
}

.approx-sign,
.expand-arrow {
  margin: 0 -7px;
}
</style>
