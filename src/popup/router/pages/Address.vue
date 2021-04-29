<template>
  <div class="address">
    <div class="section-title">
      {{ $t('pages.tipPage.sendToAddress') }}
    </div>

    <div class="url-bar link-sm text-left">
      {{ callbackOrigin }}
    </div>

    <Button @click="openCallbackOrGoHome(true, { address: $store.getters.account.address })">
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
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

.address {
  .url-bar {
    color: variables.$color-white;
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
