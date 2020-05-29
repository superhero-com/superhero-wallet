<template>
  <main class="wrapper center">
    <Logo class="logo" />
    <p class="primary-title primary-title-small">
      {{ $t('pages.index.heading') }}
    </p>
    <div class="install-native-version" v-if="IS_WEB">
      <a href="https://apps.apple.com/bg/app/superhero-wallet/id1502786641"
        ><img src="../../../icons/app-store.svg" alt="App Store"
      /></a>
      <a href="https://play.google.com/store/apps/details?id=com.superhero.cordova"
        ><img src="../../../icons/google-play.svg" alt="Google Play"
      /></a>
      <span>{{ $t('pages.index.webVersion') }}</span>
    </div>
    <CheckBox v-if="!termsAgreed" v-model="terms" data-cy="checkbox" class="checkbox">
      <div class="primary-text">
        {{ $t('pages.index.term1') }}
        <router-link to="/termsOfService" data-cy="terms">{{
          $t('pages.index.termsAndConditions')
        }}</router-link>
      </div>
    </CheckBox>
    <Button
      @click="generwateWalletIntro"
      :disabled="!terms && !termsAgreed"
      data-cy="generate-wallet"
    >
      {{ $t('pages.index.generateWallet') }}
    </Button>
    <Button @click="importAccount" :disabled="!terms && !termsAgreed" data-cy="import-wallet">
      {{ $t('pages.index.importWallet') }}
    </Button>
  </main>
</template>

<script>
import { mapGetters } from 'vuex';
import Logo from '../../../icons/logo.svg?vue-component';
import CheckBox from '../components/CheckBox';

export default {
  name: 'Home',
  components: {
    Logo,
    CheckBox,
  },
  data() {
    return {
      terms: false,
      termsAgreed: false,
      IS_WEB: process.env.PLATFORM === 'web',
    };
  },
  computed: mapGetters(['account', 'isLoggedIn', 'wallet', 'tokens']),
  methods: {
    generwateWalletIntro() {
      this.$router.push('/intro');
    },
    importAccount() {
      this.$router.push('/importAccount');
    },
  },
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
.checkbox {
  margin: 0 auto 25px auto;
  max-width: 357px;
}
</style>
