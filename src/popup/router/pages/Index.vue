<template>
  <div>
    <Loader size="small" :loading="loading" v-bind="{ content: $t('pages.index.securingAccount') }"></Loader>
    <main>
      <div class="wrapper center">
        <Logo class="logo" />
        <p class="primary-title primary-title-small">
          {{ $t('pages.index.heading') }}
        </p>
        <CheckBox v-if="!termsAgreedOrNot" v-model="terms" data-cy="checkbox" class="mb-25">
          <div class="primary-text">
            {{ $t('pages.index.term1') }} <a @click="goToTermsAndConditions" data-cy="terms"> {{ $t('pages.index.termsAndConditions') }} </a>
          </div>
        </CheckBox>
        <Button @click="generwateWalletIntro" :disabled="!terms && !termsAgreedOrNot" data-cy="generate-wallet">
          {{ $t('pages.index.generateWallet') }}
        </Button>
        <Button @click="importAccount" :disabled="!terms && !termsAgreedOrNot" data-cy="import-wallet">
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
