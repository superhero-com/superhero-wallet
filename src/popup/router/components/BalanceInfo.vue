<template>
  <div class="external-svg" :style="{ 'background-image': 'url(' + accbalanceBG + ')' }">
    <span class="title">{{ $t('pages.account.balance') }}</span>
    <div class="balance no-sign">
      <div class="amount">
        <span>{{ tokenBalance }}</span>
        <span>{{ $t('pages.appVUE.aeid') }}</span>
      </div>
      <div class="currenciesgroup">
        <span class="approx-sign">~</span>
        <li id="currencies" class="have-subDropdown" :class="dropdown.currencies ? 'show' : ''">
          <div class="input-group-area">
            <ae-button @click="toggleDropdown($event, '.have-subDropdown')">
              {{ balanceCurrency }}
              <span class="accent-text">{{ currentCurrency }}</span>
              <DropdownArrow />
            </ae-button>
          </div>
          <ul class="sub-dropdown">
            <li class="single-currency" v-for="(index, item) in currencies" :key="index">
              <ae-button v-on:click="switchCurrency(index, item)" :class="current.currency == item ? 'current' : ''">
                {{ item.toUpperCase() }}
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
import DropdownArrow from '../../../icons/dropdownarrow.svg';

export default {
  components: {
    DropdownArrow,
  },
  data() {
    return {
      accbalanceBG: browser.runtime.getURL('../../../icons/acc_balance.png'),
      dropdown: {
        currencies: false,
      },
    };
  },
  computed: {
    ...mapGetters(['tokenBalance', 'balanceCurrency', 'current', 'currentCurrency', 'currencies']),
  },
  methods: {
    async toggleDropdown(event, parentClass) {
      if (typeof parentClass === 'undefined') {
        parentClass = '.currenciesgroup';
      }
      const dropdownParent = event.target.closest(parentClass);
      this.dropdown[dropdownParent.id] = !this.dropdown[dropdownParent.id];
    },
    async switchCurrency(index, item) {
      await browser.storage.local.set({ currency: item });
      this.$store.commit('SET_CURRENCY', { currency: item, currencyRate: this.currencies[item] });
      this.dropdown.currencies = false;
    },
  },
};
</script>

<style lang="scss">
@import '../../../common/variables';

.input-group-area {
  width: 100%;
}
.currenciesgroup {
  font-size: 18px;
  width: 90%;
  display: flex;
  justify-content: center;
  .approx-sign {
    padding: 3px 10px;
  }
}
.currenciesgroup li {
  list-style-type: none;
}
.currenciesgroup li .ae-icon {
  font-size: 1.2rem;
  margin: 10px 0px 0px 0px;
}
.currenciesgroup button {
  font-size: 14px;
  width: 100%;
  color: $black-color;
  text-align: left;
  margin: 0;
  padding: 0 1rem;
  white-space: nowrap;
  justify-content: unset;
  padding: 0 5px !important;
  span {
    padding: 0 5px;
  }
}
.currenciesgroup ul {
  margin: 0;
  box-shadow: none;
  visibility: hidden;
  max-height: 0;
  padding: 0;
  overflow: hidden;
  transition: all 0.3s ease-in-out;
  right: 0;
  background: $nav-bg-color;
  border: 1px solid $button-color;
}
.currenciesgroup .have-subDropdown.show ul.sub-dropdown {
  visibility: visible;
  max-height: 165px;
  overflow-y: scroll;
}
.currenciesgroup .have-subDropdown.show .ae-button .ae-icon-left-more {
  transform: rotate(90deg);
}
.ae-list .ae-list-item:first-child {
  border-top: none !important;
}
.sub-dropdown .single-currency:hover {
  border-left: 2px solid $secondary-color;
  background: rgba(226, 226, 226, 0.5);
}

.external-svg {
  height: 84px;
  position: relative;
  text-align: center;
  .title {
    position: absolute;
    left: 20px;
    top: 50%;
    margin-top: -24px;
    color: $white-color !important;
    font-size: 16px;
    padding: 0;
  }
  .balance {
    width: 163px;
    height: 60px;
    margin: auto;
    position: absolute;
    left: 50%;
    margin-left: -81px;
    top: 50%;
    margin-top: -36px;
    font-size: 26px;
    .amount {
      font-size: 26px;
      color: $text-color !important;
      :last-child {
        color: $secondary-color !important;
      }
    }
    .ae-button {
      display: block;
      font-size: 18px;
      color: $text-color !important;
    }
  }
}
</style>
