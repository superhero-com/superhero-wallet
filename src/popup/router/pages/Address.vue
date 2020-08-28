<template>
  <div class="popup">
    <div class="section-title">
      {{ $t('pages.tipPage.sendToAddress') }}
    </div>

    <div class="url-bar link-sm text-left">
      {{ callbackOrigin }}
    </div>

    <Button @click="sendAddress">
      {{ $t('pages.tipPage.confirm') }}
    </Button>
    <Button @click="openCallbackOrGoHome('x-cancel')">
      {{ $t('pages.tipPage.cancel') }}
    </Button>
  </div>
</template>

<script>
import openUrl from '../../utils/openUrl';

export default {
  computed: {
    callbackOrigin() {
      return new URL(this.$route.query['x-success']).origin;
    },
  },
  methods: {
    openCallbackOrGoHome(paramName) {
      const callbackUrl = this.$route.query[paramName];
      if (callbackUrl) openUrl(callbackUrl);
      else this.$router.push('/account');
    },
    sendAddress() {
      openUrl(
        this.$route.query['x-success'].replace(/{address}/g, this.$store.getters.account.publicKey),
      );
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';

.url-bar {
  color: $text-color;
}

.section-title {
  margin-bottom: 8px;
  margin-top: 16px;
  font-size: 16px;
  color: $white-color;
  font-weight: 400;
  text-align: left;
}
</style>
