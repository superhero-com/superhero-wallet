<template>
  <main class="wrapper center">
    <Logo class="logo" />
    <p class="primary-title primary-title-small">
      {{ $t('pages.index.heading') }}
    </p>
    <div class="install-native-version" v-if="IS_WEB">
      <a href="https://example.com/"><img src="../../../icons/app-store.svg" alt="App Store"/></a>
      <a href="https://example.com/"><img src="../../../icons/google-play.svg" alt="Google Play"/></a>
      <span>Or use a web version</span>
    </div>
    <CheckBox v-if="!termsAgreedOrNot" v-model="terms" data-cy="checkbox" class="mb-25">
      <div class="primary-text">
        {{ $t('pages.index.term1') }}
        <router-link to="/termsOfService" data-cy="terms">{{ $t('pages.index.termsAndConditions') }}</router-link>
      </div>
    </CheckBox>
    <Button @click="generwateWalletIntro" :disabled="!terms && !termsAgreedOrNot" data-cy="generate-wallet">
      {{ $t('pages.index.generateWallet') }}
    </Button>
    <Button @click="importAccount" :disabled="!terms && !termsAgreedOrNot" data-cy="import-wallet">
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
      termsAgreedOrNot: false,
      IS_WEB: process.env.PLATFORM === 'web',
    };
  },
  computed: {
    ...mapGetters(['account', 'isLoggedIn', 'wallet', 'tokens']),
  },
  mounted() {},
  created() {
    browser.storage.local.get('termsAgreed').then(res => {
      this.termsAgreedOrNot = res.termsAgreed;
    });
  },
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
.install-native-version > * {
  display: block;
  width: 270px;
  margin: 15px auto;
}
</style>
