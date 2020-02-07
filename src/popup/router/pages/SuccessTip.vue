<template>
  <div class="popup">
      <h3 class="heading">{{ $t('pages.successTip.completedHeading') }}</h3>
      <p class="sub-heading">You’ve successfully sent {{ amountTip }} æid in <b>TIPS</b> to (URL)</p>
      <small
        ><i>{{ $t('pages.successTip.sentTo') }} {{ domain }}</i></small
      >
      <h3>{{ $t('pages.successTip.letThemKnow') }}</h3>
      <div>
        <div class="flex flex-align-center flex-justify-between">
          <ae-button face="round" fill="primary" @click="toTips"
            >Send more <br />
            Tips</ae-button
          >
          <ae-button face="round" fill="secondary" @click="toDashboard">{{ $t('pages.appVUE.dashboard') }} <br /></ae-button>
        </div>
        <br />
        <div>
          <span style="word-break: break-word;font-size: 14px;float: left;">Notify someone that you sent æid to this post</span>
          <Textarea v-model="note" size="h-50"/>
        </div>
        <br />
        <ae-button face="round" extend @click="redirectOnFeed">{{ $t('pages.successTip.feed') }}</ae-button>
      </div>
  </div>
</template>

<script>
import BigNumber from 'bignumber.js';
import { MAGNITUDE } from '../../utils/constants';

export default {
  props: ['amount', 'domain'],
  data() {
    return {
      feed: 'https://coronanews.org',
      note: 'I just sent æid to this post! Anyone can start sending and receiving æid through CoronaNews. Learn more.'
    };
  },
  computed: {
    amountTip() {
      return this.amount;
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
    }
  },
};
</script>

<style scoped>
h4,
h3,
small {
  word-break: break-word;
}
.sub-heading {
  font-weight: 500;
  margin: 0;
}
.heading {
  margin-bottom: 5px;
  text-transform: uppercase;
}
</style>
