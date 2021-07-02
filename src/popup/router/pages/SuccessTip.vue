<template>
  <div
    class="success-tip"
    data-cy="success-tip"
  >
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
    <a
      class="link-sm text-left block"
      data-cy="tip-url"
    >{{ tipUrl }}</a>
    <br>
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
    <p
      v-if="!(tipUrl && isVerifiedUrl)"
      class="f-14 sub-heading text-left"
    >
      {{ $t('pages.successTip.note') }}
    </p>
    <p class="f-18 my-35">
      {{ $t('pages.successTip.letThemKnow') }}
    </p>
    <div>
      <div class="flex flex-align-center flex-justify-between">
        <Button
          half
          data-cy="to-tips"
          @click="$router.push('/tips')"
        >
          {{ $t('pages.successTip.sendMore') }}
        </Button>
        <Button
          half
          data-cy="to-dashboard"
          @click="$router.push('/account')"
        >
          {{ $t('pages.titles.home') }}
        </Button>
      </div>
      <br>
      <Button
        :to="AGGREGATOR_URL"
        extend
      >
        {{ $t('pages.successTip.feed') }}
      </Button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Heart from '../../../icons/heart.svg?vue-component';
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
  props: {
    amount: { type: [Number, String], default: 0 },
    tipUrl: { type: [String, URL], default: '' },
  },
  data: () => ({ AGGREGATOR_URL }),
  computed: {
    ...mapGetters(['formatCurrency', 'currentCurrencyRate']),
    ...mapGetters('fungibleTokens', ['selectedToken']),
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
  async mounted() {
    if (process.env.IS_EXTENSION) {
      const { addresses, tab } = await this.$store.dispatch('getWebPageAddresses');
      if (addresses.length) {
        await this.$store
          .dispatch('claimTips', { url: tab.url, address: addresses[0] })
          .catch((error) => Logger.write({ ...error, modal: false }));
      }
    }
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

.success-tip {
  .sub-heading {
    font-size: 14px;
    font-weight: normal;
    margin: 8px 0;
  }

  .note {
    color: variables.$color-white;
    font-size: variables.$base-font-size;
    min-height: 100px;
    border-radius: 5px;
    border: 2px solid variables.$color-border;
    background: variables.$color-bg-2;
    padding: 15px;
  }
}
</style>
