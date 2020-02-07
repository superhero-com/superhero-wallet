<template>
  <div>
    <Loader size="small" :loading="loading" v-bind="{ content: $t('pages.index.securingAccount') }"></Loader>
    <main>
      <div class="wrapper center">
        <Logo class="logo" />
        <p class="primary-title">
          {{ $t('pages.index.heading') }} <span class="secondary-text"> {{ $t('pages.appVUE.aeid') }} </span>
        </p>
        <CheckBox v-if="!termsAgreedOrNot || termsAgreedOrNot == undefined" v-model="terms">
          <div class="primary-text">
            {{ $t('pages.index.term1') }} <a @click="goToTermsAndConditions"> {{ $t('pages.index.termsAndConditions') }} </a>
          </div>
        </CheckBox>
        <Button @click="generwateWalletIntro" :disabled="!terms && !termsAgreedOrNot ? true : false">
          {{ $t('pages.index.generateWallet') }}
        </Button>
        <Button @click="importAccount" :disabled="!terms && !termsAgreedOrNot ? true : false">
          {{ $t('pages.index.importWallet') }}
        </Button>
      </div>
    </main>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Logo from '../../../icons/logo.svg';
import CheckBox from '../components/CheckBox';

export default {
  name: 'Home',
  components: {
    Logo,
    CheckBox,
  },
  data() {
    return {
      loading: false,
      terms: false,
      termsAgreedOrNot: false,
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
    goToTermsAndConditions() {
      this.$router.push('/termsOfService');
    },
    generwateWalletIntro() {
      this.$router.push('/intro');
    },
    importAccount() {
      this.$router.push('/importAccount');
    },
  },
};
</script>
