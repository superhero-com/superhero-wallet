<template>
  <div class="popup" data-cy="success-tip">
    <h3 class="heading-1 mb-25 mt-15 center">
      <div class="flex flex-align-center flex-justify-content-center">
        <Heart />
        <span class="ml-5">{{ $t('pages.successTip.completedHeading') }}</span>
      </div>
    </h3>
    <p class="primary-title text-left mb-8 f-16">
      {{ $t('pages.successTip.successfullySent') }}
      <TokenAmount
        v-bind="
          selectedToken ? { amount: +amount, symbol: selectedToken.symbol } : { amount: amountTip }
        "
        data-cy="tip-amount"
      />
      {{ $t('pages.successTip.to') }}
    </p>
    <a class="link-sm text-left block" data-cy="tip-url">{{ tipUrl }}</a>
    <br />
    <div>
      {{ $t('pages.successTip.notify') }}
      <TokenAmount
        v-bind="
          selectedToken ? { amount: +amount, symbol: selectedToken.symbol } : { amount: amountTip }
        "
      />
      {{ $t('pages.successTip.notifyTo') }}
      <div class="note">
        {{ note }}
      </div>
    </div>
    <p class="f-14 sub-heading text-left" v-if="!(tipUrl && isVerifiedUrl)">
      {{ $t('pages.successTip.note') }}
    </p>
    <p class="f-18 my-35">{{ $t('pages.successTip.letThemKnow') }}</p>
    <div>
      <div class="flex flex-align-center flex-justify-between">
        <Button half @click="$router.push('/tip')" data-cy="to-tips">
          {{ $t('pages.successTip.sendMore') }}
        </Button>
        <Button half @click="$router.push('/account')" data-cy="to-dashboard">
          {{ $t('pages.successTip.home') }}
        </Button>
      </div>
      <br />
      <Button @click="redirectOnFeed" extend>
        {{ $t('pages.successTip.feed') }}
      </Button>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import Heart from '../../../icons/heart.svg?vue-component';
import openUrl from '../../utils/openUrl';
import { AGGREGATOR_URL } from '../../utils/constants';
import { aettosToAe } from '../../utils/helper';
import Logger from '../../../lib/logger';
import TokenAmount from '../components/TokenAmount';
import Button from '../components/Button';

export default {
  components: {
    Heart,
    TokenAmount,
    Button,
  },
  props: ['amount', 'tipUrl'],
  computed: {
    ...mapGetters(['formatCurrency', 'currentCurrencyRate']),
    ...mapState('fungibleTokens', ['selectedToken']),
    amountTip() {
      return +aettosToAe(this.amount);
    },
    isVerifiedUrl() {
      return this.$store.getters['tipUrl/status'](this.tipUrl) === 'verified';
    },
    formatReceivedTokensForLocale() {
      return {
        amount: this.selectedToken
          ? `${this.amount} ${this.selectedToken.symbol}`
          : `${+this.amountTip.toFixed(2)} AE (~${this.formatCurrency(
              (this.amountTip * this.currentCurrencyRate).toFixed(2),
            )})`,
      };
    },
    note() {
      return this.$t('pages.successTip.notifyMessage', this.formatReceivedTokensForLocale);
    },
  },
  async created() {
    if (process.env.IS_EXTENSION) {
      const { addresses, tab } = await this.$store.dispatch('getWebPageAddresses');
      if (addresses.length) {
        await this.$store
          .dispatch('claimTips', { url: tab.url, address: addresses[0] })
          .catch((error) => Logger.write({ ...error, modal: false }));
      }
    }
  },
  methods: {
    redirectOnFeed() {
      openUrl(AGGREGATOR_URL, true);
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.sub-heading {
  font-size: 14px;
  font-weight: normal;
  margin: 8px 0;
}

.note {
  color: $text-color;
  font-size: $font-size;
  min-height: 100px;
  border-radius: 5px;
  border: 2px solid $border-color;
  background: $input-bg-color;
  padding: 15px;
}
</style>
