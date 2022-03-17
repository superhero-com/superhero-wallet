<template>
  <div
    class="success-tip"
    data-cy="success-tip"
  >
    <div class="header">
      <Heart />
      <span>{{ $t('pages.successTip.completedHeading') }}</span>
    </div>
    <div>
      {{ $t('pages.successTip.successfullySent') }}
      <TokenAmount
        v-bind="
          selectedToken
            ? { amount: +amount, symbol: selectedToken.symbol, aex9: true }
            : { amount: amountTip }
        "
        data-cy="tip-amount"
      />
      {{ $t('pages.successTip.to') }}
    </div>
    <a
      class="url"
      data-cy="tip-url"
    >
      {{ tipUrl }}
    </a>
    <div>
      {{ $t('pages.successTip.notify') }}
      <TokenAmount
        v-bind="
          selectedToken
            ? { amount: +amount, symbol: selectedToken.symbol, aex9: true }
            : { amount: amountTip }
        "
      />
      {{ $t('pages.successTip.notifyTo') }}
      <div class="note">
        {{ note }}
      </div>
    </div>
    <p
      v-if="!(tipUrl && isVerifiedUrl)"
      class="sub-heading"
    >
      {{ $t('pages.successTip.note') }}
    </p>
    <p class="exclamation">
      {{ $t('pages.successTip.letThemKnow') }}
    </p>
    <div class="buttons">
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
    <Button
      :to="AGGREGATOR_URL"
      extend
    >
      {{ $t('pages.successTip.feed') }}
    </Button>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Heart from '../../../icons/heart.svg?vue-component';
import { AGGREGATOR_URL } from '../../utils/constants';
import { aettosToAe } from '../../utils/helper';
import Logger from '../../../lib/logger';
import TokenAmount from '../components/TokenAmount.vue';
import Button from '../components/Button.vue';

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
@use '../../../styles/typography';

.success-tip {
  .header {
    margin: 16px 0;
    display: flex;
    justify-content: center;

    @extend %face-sans-20-regular;

    > span {
      margin-left: 8px;
    }
  }

  .url {
    display: block;
    margin: 8px 0;

    @extend %face-sans-11-regular;
  }

  .note {
    margin-top: 8px;
    border-radius: 5px;
    border: 2px solid variables.$color-border;
    background: variables.$color-bg-2;
    padding: 12px;

    @extend %face-sans-16-regular;
  }

  .sub-heading {
    @extend %face-sans-14-regular;

    text-align: left;
    line-height: initial;
  }

  .exclamation {
    @extend %face-sans-20-bold;
  }

  .buttons {
    display: flex;
    justify-content: space-between;
  }
}
</style>
