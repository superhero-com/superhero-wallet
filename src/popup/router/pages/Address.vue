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
    <Button @click="cancel">
      {{ $t('pages.tipPage.cancel') }}
    </Button>
  </div>
</template>

<script>
import openUrl from '../../utils/openUrl';

export default {
  computed: {
    urlParams() {
      return new URL(this.$route.fullPath, window.location).searchParams;
    },
    callbackOrigin() {
      return new URL(this.urlParams.get('x-success')).origin;
    },
  },
  methods: {
    openCallbackOrGoHome(paramName) {
      const callbackUrl = this.urlParams.get(paramName);
      if (callbackUrl) openUrl(callbackUrl);
      else this.$router.push('/account');
    },
    sendAddress() {
      openUrl(
        this.urlParams
          .get('x-success')
          .replace(/{address}/g, this.$store.getters.account.publicKey),
      );
    },
    cancel() {
      this.openCallbackOrGoHome('x-cancel');
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
