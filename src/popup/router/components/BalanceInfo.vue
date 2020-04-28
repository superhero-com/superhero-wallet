<template>
  <div class="external-svg" data-cy="balance-info">
    <span class="title">{{ $t('pages.account.balance') }}</span>
    <div class="balance no-sign">
      <div class="amount">
        <span>{{ tokenBalance }}</span>
        <span>{{ $t('pages.appVUE.aeid') }}</span>
      </div>
      <div class="currenciesgroup">
        <span class="approx-sign">~</span>
        <li data-cy="currency-dropdown" class="dropdown-container" :class="dropdown ? 'show' : ''">
          <ae-button data-cy="toggle-currency-dropdown" @click="dropdown = !dropdown">
            {{ balanceCurrency }}
            <span class="currency">{{ currentCurrency }}</span>
            <ExpandedAngleArrow />
          </ae-button>
          <ul class="sub-dropdown">
            <li class="single-currency" v-for="(rate, currency) in currencies" :key="currency">
              <ae-button
                @click="switchCurrency(currency)"
                :class="current.currency === currency ? 'current' : ''"
              >
                {{ currency.toUpperCase() }}
              </ae-button>
            </li>
          </ul>
        </li>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import ExpandedAngleArrow from '../../../icons/expanded-angle-arrow.svg?vue-component';

export default {
  components: {
    ExpandedAngleArrow,
  },
  data: () => ({ dropdown: false }),
  computed: mapGetters([
    'tokenBalance',
    'balanceCurrency',
    'current',
    'currentCurrency',
    'currencies',
  ]),
  methods: {
    async switchCurrency(currency) {
      this.$store.commit('SET_CURRENCY', { currency, currencyRate: this.currencies[currency] });
      this.dropdown = false;
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

  .currency {
    color: $white-color;
  }

  li {
    list-style-type: none;

    .ae-icon {
      font-size: 1.2rem;
      margin: 10px 0px 0px 0px;
    }
  }

  button {
    font-size: 14px;
    width: 100%;
    color: $black-color;
    text-align: left;
    margin: 0;
    white-space: nowrap;
    justify-content: unset;
    padding: 0 5px !important;
  }

  ul {
    margin: 0;
    box-shadow: none;
    visibility: hidden;
    max-height: 0;
    padding: 0;
    overflow: hidden;
    transition: all 0.3s ease-in-out;
    background: $nav-bg-color;
    border: 1px solid $secondary-color;
    border-radius: 5px;
  }

  .dropdown-container {
    z-index: 1;

    &.show ul.sub-dropdown {
      visibility: visible;
      max-height: 165px;
      overflow-y: scroll;
    }
  }

  .sub-dropdown .single-currency:hover {
    background: #33343e;
  }
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

  .title {
    color: $white-color !important;
    font-size: 16px;
    padding: 0;
    margin-top: 10px;
  }
  .balance {
    font-size: 26px;
    color: $white-color;
    font-weight: normal;
    text-align: left;
    margin-left: 20px;
    line-height: 34px;
    &,
    .ae-button {
      font-family: 'Roboto', sans-serif;
    }
    .amount {
      color: $text-color;
    }
    .amount :last-child {
      color: $secondary-color;
    }
    .ae-button {
      display: block;
      font-size: 18px;
      color: $text-color !important;
      font-weight: 500;
    }
  }
}
</style>
