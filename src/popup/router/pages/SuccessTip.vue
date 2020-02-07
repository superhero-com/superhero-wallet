<template>
  <div class="popup">
    <h3 class="heading">{{ $t('pages.successTip.completedHeading') }}</h3>
    <p class="sub-heading">
      You’ve successfully sent {{ amountTip }} æid in
      <b>TIPS</b> to (URL)
    </p>
    <small>
      <i>{{ $t('pages.successTip.sentTo') }} {{ domain }}</i>
    </small>
    <h3>{{ $t('pages.successTip.letThemKnow') }}</h3>
    <div>
      <div class="flex flex-align-center flex-justify-between">
        <ae-button face="round" fill="primary" @click="toTips">
          Send more
          <br />Tips
        </ae-button>
        <ae-button face="round" fill="secondary" @click="toDashboard">
          {{ $t('pages.appVUE.dashboard') }}
          <br />
        </ae-button>
      </div>
      <br />
      <div>
        <span
          style="word-break: break-word;font-size: 14px;float: left;"
        >Notify someone that you sent æid to this post</span>
        <Textarea v-model="note" size="h-50" />
      </div>
      <br />
      <ae-button face="round" extend @click="redirectOnFeed">{{ $t('pages.successTip.feed') }}</ae-button>
    </div>
    <p class="primary-title text-left mb-8 f-16">
      {{ $t('pages.successTip.successfullySent') }}
      <span class="secondary-text">{{ amountTip }} æid</span>
      ({{ getCurrencyAmount }} {{ current.currency }})
      {{ $t('pages.successTip.to') }}
    </p>
    <a class="link-sm text-left block">{{ domain }}</a>
    <p class="f-14 sub-heading text-left">{{ $t('pages.successTip.note') }}</p>
    <a class="f-18 my-35 block">{{ $t('pages.successTip.letThemKnow') }}</a>
    <div>
      <div class="flex flex-align-center flex-justify-between">
        <Button half @click="toTips">{{ $t('pages.successTip.sendMore') }}</Button>
        <Button half @click="toDashboard">{{ $t('pages.successTip.home') }}</Button>
      </div>
      <br />
      <Button extend>{{ $t('pages.successTip.feed') }}</Button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import BigNumber from 'bignumber.js';
import { MAGNITUDE } from '../../utils/constants';
import Heart from '../../../icons/heart.svg';

export default {
  components: {
    Heart,
  },
  props: ['amount', 'domain'],
  data() {
    return {
      feed: 'https://coronanews.org',
      note: 'I just sent æid to this post! Anyone can start sending and receiving æid through CoronaNews. Learn more.'
    };
  },
  computed: {
    ...mapGetters(['current']),
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
