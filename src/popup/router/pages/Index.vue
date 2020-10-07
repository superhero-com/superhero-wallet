<template>
  <main class="wrapper center">
    <img v-if="IN_FRAME" src="../../../icons/iframe/sendAndReceive.svg" />
    <template v-else>
      <Logo class="logo" />
      <p class="primary-title primary-title-small">
        {{ $t('pages.index.heading') }}
      </p>
      <div class="install-native-version" v-if="IS_WEB">
        <a href="https://testflight.apple.com/join/3o5r4dQQ"
          ><img src="../../../icons/app-store.svg" alt="App Store"
        /></a>
        <a href="https://play.google.com/store/apps/details?id=com.superhero.cordova"
          ><img src="../../../icons/google-play.svg" alt="Google Play"
        /></a>
        <span>{{ $t('pages.index.webVersion') }}</span>
      </div>
    </template>
    <CheckBox v-model="termsAgreed" data-cy="checkbox">
      <div class="primary-text">
        {{ $t('pages.index.term1') }}
        <router-link to="/termsOfService" data-cy="terms">{{
          $t('pages.index.termsAndConditions')
        }}</router-link>
      </div>
    </CheckBox>
    <Button @click="$router.push('/intro')" :disabled="!termsAgreed" data-cy="generate-wallet">
      {{ $t('pages.index.generateWallet') }}
    </Button>
    <Button
      @click="$router.push('/importAccount')"
      :disabled="!termsAgreed"
      data-cy="import-wallet"
    >
      {{ $t('pages.index.importWallet') }}
    </Button>
  </main>
</template>

<script>
import Logo from '../../../icons/logo.svg?vue-component';
import { IN_FRAME } from '../../utils/helper';
import CheckBox from '../components/CheckBox';

export default {
  name: 'Home',
  components: {
    Logo,
    CheckBox,
  },
  data: () => ({
    termsAgreed: false,
    IS_WEB: process.env.PLATFORM === 'web',
    IN_FRAME,
  }),
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';

.install-native-version > * {
  display: block;
  width: 270px;
  margin: 15px auto;
}

.primary-text {
  color: $white-color;
  font-size: 0.88rem;
}

.primary-title {
  font-weight: 500;
}

.checkbox-container {
  margin: 0 auto 25px auto;
  max-width: 270px;

  /* stylelint-disable-next-line selector-pseudo-element-no-unknown */
  ::v-deep .checkmark {
    margin-right: 5px;
  }
}
</style>
