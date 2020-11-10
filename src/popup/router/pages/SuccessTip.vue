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
      <span data-cy="tip-amount"
        >{{ selectedToken ? amount : amountTip }}
        <span class="symbol">{{
          selectedToken ? selectedToken.symbol : $t('pages.appVUE.aeid')
        }}</span>
      </span>
      <FormatFiatCurrency :balance="amountTip * currentCurrencyRate" />
      {{ $t('pages.successTip.to') }}
    </p>
    <a class="link-sm text-left block" data-cy="tip-url">{{ tipUrl }}</a>
    <br />
    <div>
      {{ $t('pages.successTip.notify') }}
      {{ selectedToken ? amount : amountTip }}
      <span class="symbol">{{
        selectedToken ? selectedToken.symbol : $t('pages.appVUE.aeid')
      }}</span>
      <FormatFiatCurrency :balance="amountTip * currentCurrencyRate" />
      {{ $t('pages.successTip.notifyTo') }}
      <Textarea v-model="note" :value="note" size="h-50" />
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
import Textarea from '../components/Textarea';
import openUrl from '../../utils/openUrl';
import { AGGREGATOR_URL } from '../../utils/constants';
import { aettosToAe } from '../../utils/helper';
import Logger from '../../../lib/logger';
import FormatFiatCurrency from '../components/FormatFiatCurrency';

export default {
  components: {
    Heart,
    Textarea,
    FormatFiatCurrency,
  },
  props: ['amount', 'tipUrl'],
  computed: {
    ...mapGetters(['formatCurrency', 'currentCurrencyRate']),
    ...mapState('fungibleTokens', ['selectedToken']),
    amountTip() {
      return (+aettosToAe(this.amount)).toFixed(2);
    },
    isVerifiedUrl() {
      return this.$store.getters['tipUrl/status'](this.tipUrl) === 'verified';
    },
    formatReceivedTokensForLocale() {
      return {
        amount: this.selectedToken
          ? `${this.amount} ${this.selectedToken.symbol}`
          : `${this.amountTip} AE (~${this.formatCurrency(
              (this.amountTip * this.currentCurrencyRate).toFixed(3),
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
          .catch(error => Logger.write({ ...error, modal: false }));
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
@import '../../../common/variables';

.symbol {
  color: $secondary-color;
}
</style>
