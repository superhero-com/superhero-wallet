<template>
  <div class="address">
    <div class="section-title">
      {{ $t('pages.tipPage.sendToAddress') }}
    </div>

    <div class="url-bar">
      {{ callbackOrigin }}
    </div>

    <BtnMain
      class="btn-confirm"
      extend
      @click="openCallbackOrGoHome(true, { address: $store.getters.account.address })"
    >
      {{ $t('pages.tipPage.confirm') }}
    </BtnMain>
    <BtnMain
      extend
      @click="openCallbackOrGoHome(false)"
    >
      {{ $t('pages.tipPage.cancel') }}
    </BtnMain>
  </div>
</template>

<script>
import BtnMain from '../components/buttons/BtnMain.vue';
import deeplinkApi from '../../mixins/deeplinkApi';

export default {
  components: { BtnMain },
  mixins: [deeplinkApi],
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.address {
  padding: var(--screen-padding-x);

  .url-bar {
    margin: 8px 0;
    text-align: left;
    color: variables.$color-white;

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

  .btn-confirm {
    margin-bottom: var(--gap);
  }
}
</style>
