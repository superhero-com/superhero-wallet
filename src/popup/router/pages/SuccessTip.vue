<template>
  <div class="popup">
    <h3 class="heading-1 mb-25 mt-15 center">
      <div class="flex flex-align-center flex-justify-content-center">
        <Heart />
        <span class="ml-5">{{ $t('pages.successTip.completedHeading') }}</span>
      </div>
    </h3>
    <p class="primary-title primary-title-darker text-left mb-8 f-16">
      {{ $t('pages.successTip.successfullySent') }} <span class="secondary-text">{{ amountTip }} {{ $t('pages.appVUE.aeid') }} </span> ({{ getCurrencyAmount }}
      {{ currentCurrency }})
      {{ $t('pages.successTip.to') }}
    </p>
    <a class="link-sm text-left block">{{ domain }}</a>
    <br />
    <div>
      <span style="word-break: break-word;font-size: 14px;float: left;">{{ $t('pages.successTip.notify') }}</span>
      <Textarea v-model="note" :value="note" size="h-50" />
    </div>
    <p class="f-14 sub-heading text-left">
      {{ $t('pages.successTip.note') }}
    </p>
    <a class="f-18 my-35 block">{{ $t('pages.successTip.letThemKnow') }}</a>
    <div>
      <div class="flex flex-align-center flex-justify-between">
        <Button half @click="toTips">
          {{ $t('pages.successTip.sendMore') }}
        </Button>
        <Button half @click="toDashboard">
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
import { mapGetters } from 'vuex';
import BigNumber from 'bignumber.js';
import { MAGNITUDE } from '../../utils/constants';
import Heart from '../../../icons/heart.svg';
import Textarea from '../components/Textarea';

export default {
  components: {
    Heart,
    Textarea,
  },
  props: ['amount', 'domain'],
  data() {
    return {
      feed: 'https://coronanews.org',
      note: this.$t('pages.successTip.notifyMessage'),
    };
  },
  computed: {
    ...mapGetters(['current', 'currentCurrency']),
    amountTip() {
      return this.amount;
    },
    getCurrencyAmount() {
      return (this.amountTip * this.current.currencyRate).toFixed(3);
    },
  },
  created() {},
  methods: {
    toTips() {
      this.$router.push('/tip');
    },
    toDashboard() {
      this.$router.push('/account');
    },
    redirectOnFeed() {
      browser.tabs.create({ url: this.feed, active: true });
    },
  },
};
</script>
