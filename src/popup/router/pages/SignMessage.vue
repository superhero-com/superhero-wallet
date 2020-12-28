<template>
  <!-- remove when we'll be sure about the wording -->
  <!-- eslint-disable vue-i18n/no-raw-text -->
  <div class="popup">
    <div class="section-title">Sign message for</div>

    <div class="url-bar link-sm text-left">
      {{ callbackOrigin }}
    </div>

    <div class="section-title">Message</div>

    <div class="tip-note-preview mt-15">
      {{ $route.query.message }}
    </div>

    <Button @click="sendAddress">
      {{ $t('pages.tipPage.confirm') }}
    </Button>
    <Button @click="openCallbackOrGoHome(false)">
      {{ $t('pages.tipPage.cancel') }}
    </Button>
  </div>
</template>

<script>
import Button from '../components/Button';
import deeplinkApi from '../../../mixins/deeplinkApi';

export default {
  components: { Button },
  mixins: [deeplinkApi],
  methods: {
    async sendAddress() {
      await this.$watchUntilTruly(() => this.$store.state.sdk);
      const signature = await this.$store.state.sdk.signMessage(this.$route.query.message);
      const signatureHex = Buffer.from(signature).toString('hex');
      this.openCallbackOrGoHome(true, { signature: signatureHex });
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

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
