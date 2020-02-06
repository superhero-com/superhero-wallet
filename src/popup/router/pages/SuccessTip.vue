<template>
  <div class="popup">
      <h3 class="heading-1 mb-25 mt-15 center">
          <div class="flex flex-align-center flex-justify-content-center">
            <Heart />
            <span class="ml-5">{{ $t('pages.successTip.completedHeading') }}</span>
          </div>
      </h3>
      <p class="primary-title text-left mb-8 f-16">
        {{ $t('pages.successTip.successfullySent') }} <span class="secondary-text">{{ amountTip }} æid</span> (0.30 USD) {{ $t('pages.successTip.to') }}
      </p>
      <a class="link-sm text-left block">{{ domain }}</a>
      <p class="f-14 sub-heading text-left">
        {{ $t('pages.successTip.note') }}
      </p>
      <a class="f-18 my-35 block">{{ $t('pages.successTip.letThemKnow') }}</a>
      <div>
        <div class="flex flex-align-center flex-justify-between">
          <Button half  @click="toTips">
            {{ $t('pages.successTip.sendMore') }}
          </Button>
          <Button half  @click="toDashboard">
            {{ $t('pages.successTip.home') }}
          </Button>
        </div>
        <br />
         <Button extend>
          {{ $t('pages.successTip.feed') }}
        </Button>
      </div>
  </div>
</template>

<script>
import BigNumber from 'bignumber.js';
import { MAGNITUDE } from '../../utils/constants';
import Heart from '../../../icons/heart.svg'

export default {
  components: {
    Heart
  },
  props: ['amount', 'domain'],
  data() {
    return {
      feed: 'https://coronanews.org'
    };
  },
  computed: {
    amountTip() {
      return BigNumber(this.amount).shiftedBy(-MAGNITUDE);
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
