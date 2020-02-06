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
        <ae-button face="round" extend>{{ $t('pages.successTip.feed') }}</ae-button>
      </div>
  </div>
</template>

<script>
import BigNumber from 'bignumber.js';
import { MAGNITUDE } from '../../utils/constants';

export default {
  props: ['amount', 'domain'],
  data() {
    return {};
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
