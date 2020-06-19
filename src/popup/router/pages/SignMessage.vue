<template>
  <!-- remove when we'll be sure about the wording -->
  <!-- eslint-disable vue-i18n/no-raw-text -->
  <div class="popup">
    <div class="section-title">
      Sign message for
    </div>

    <div class="url-bar link-sm text-left">
      {{ callbackOrigin }}
    </div>

    <div class="section-title">
      Message
    </div>

    <div class="tip-note-preview mt-15">
      {{ urlParams.get('message') }}
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
    async sendAddress() {
      await this.$watchUntilTruly(() => this.$store.state.sdk);
      const signature = await this.$store.state.sdk.signMessage(this.urlParams.get('message'));
      const signatureHex = Buffer.from(signature).toString('hex');
      openUrl(this.urlParams.get('x-success').replace(/{signature}/g, signatureHex));
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
