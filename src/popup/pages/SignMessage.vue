<template>
  <div class="sign-message">
    <div class="section-title">
      Sign message for
    </div>

    <div class="url-bar">
      {{ callbackOrigin }}
    </div>

    <div class="section-title">
      Message
    </div>

    <div class="tip-note-preview">
      {{ $route.query.message }}
    </div>

    <BtnMain @click="sendAddress">
      {{ $t('pages.tipPage.confirm') }}
    </BtnMain>
    <BtnMain @click="openCallbackOrGoHome(false)">
      {{ $t('pages.tipPage.cancel') }}
    </BtnMain>
  </div>
</template>

<script>
import BtnMain from '../components/buttons/BtnMain.vue';
import { watchUntilTruthy } from '../utils/helper';
import deeplinkApi from '../../mixins/deeplinkApi';

export default {
  components: { BtnMain },
  mixins: [deeplinkApi],
  methods: {
    async sendAddress() {
      await watchUntilTruthy(() => this.$store.state.sdk);
      const signature = await this.$store.state.sdk.signMessage(this.$route.query.message);
      const signatureHex = Buffer.from(signature).toString('hex');
      this.openCallbackOrGoHome(true, { signature: signatureHex });
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.sign-message {
  .url-bar {
    color: variables.$color-white;
    text-align: left;
    margin: 8px 0;

    @extend %face-sans-11-regular;
  }

  .section-title {
    margin-bottom: 8px;
    margin-top: 16px;
    font-size: 16px;
    color: variables.$color-white;
    font-weight: 400;
    text-align: left;
  }
}
</style>
