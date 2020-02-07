<template>
  <div class="center how-to-url">
    <Button :style="styling" @click="openHowToClaimURL"><Claim class="mr-5" /> {{ $t('pages.account.howToClaim') }}</Button>
  </div>
</template>

<script>
import Button from './Button';
import Claim from '../../../icons/claim.svg';

export default {
  props: ['styling'],
  components: {
    Button,
    Claim,
  },
  data() {
    return {
      howToClaimURL: 'https://forum.aeternity.com/t/receive-and-tip-the-best-corona-news/5957',
    };
  },
  created() {},
  methods: {
    openHowToClaimURL() {
      browser.tabs.create({ url: this.howToClaimURL, active: true });
    },
  },
};
</script>

<style scoped>
.how-to-url button {
  background: #505058;
  color: #bcbcc4;
  font-size: 18px;
  border-radius: 5px;
  width: 270px;
  line-height: 38px;
}
.how-to-url svg {
  vertical-align: middle;
}
</style>
