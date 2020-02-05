<template>
  <div>
    <Loader size="small" :loading="loading" v-bind="{'content':$t('pages.index.securingAccount')}"></Loader>
    <main>
      <div class="wrapper center">
        <Logo class="logo" /> 
        <p class="primary-title">{{ $t('pages.index.heading') }} <span class="secondary-text"> {{ $t('pages.appVUE.aeid') }} </span></p>
        <CheckBox v-if="!termsAgreedOrNot || termsAgreedOrNot == undefined" v-model="terms">
          <div class="primary-text">
            {{ $t('pages.index.term1') }} <a @click="goToTermsAndConditions"> {{ $t('pages.index.termsAndConditions') }} </a>
          </div>
        </CheckBox>
        <Button @click="generwateWalletIntro" :disabled=" !terms && !termsAgreedOrNot ? true : false ">
          {{ $t('pages.index.generateWallet') }} 
        </Button>
        <Button @click="importAccount" :disabled=" !terms && !termsAgreedOrNot ? true : false ">
          {{ $t('pages.index.importWallet') }} 
        </Button>
      </div>
     </main>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { fetchData, redirectAfterLogin, parseFromStorage } from '../../utils/helper';
import Logo from '../../../icons/logo.svg';

export default {
  name: 'Home',
  components: {
    Logo,
  },
  data() {
    return {
      loading: false,
      logo: browser.runtime.getURL('../../../icons/icon_128.png'),
      terms: false,
      termsAgreedOrNot: false,
      walletType: null,
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
    this.init();
  },
  methods: {
    goToTermsAndConditions() {
      this.$router.push('/termsOfService');
    },
    init() {
      browser.storage.local.get('isLogged').then(data => {
        browser.storage.local.get('userAccount').then(async user => {
          if (user.userAccount && user.hasOwnProperty('userAccount')) {
            this.$store.commit('UPDATE_ACCOUNT', user.userAccount);
            const address = await this.$store.dispatch('generateWallet', { seed: user.userAccount.privateKey });
            // if (data.isLogged && data.hasOwnProperty('isLogged')) {
            browser.storage.local.get('subaccounts').then(subaccounts => {
              const sub = [];
              if (
                !subaccounts.hasOwnProperty('subaccounts') ||
                subaccounts.subaccounts == '' ||
                (typeof subaccounts.subaccounts === 'object' && !subaccounts.subaccounts.find(f => f.publicKey == user.userAccount.publicKey))
              ) {
                sub.push({
                  name: typeof subaccounts.subaccounts !== 'undefined' ? subaccounts.subaccounts.name : 'Main account',
                  publicKey: user.userAccount.publicKey,
                  root: true,
                  balance: 0,
                });
              }
              if (subaccounts.hasOwnProperty('subaccounts') && subaccounts.subaccounts.length > 0 && subaccounts.subaccounts != '') {
                subaccounts.subaccounts.forEach(su => {
                  sub.push({ ...su });
                });
              }
              this.$store.dispatch('setSubAccounts', sub);
              browser.storage.local.get('activeAccount').then(active => {
                if (active.hasOwnProperty('activeAccount')) {
                  this.$store.commit('SET_ACTIVE_ACCOUNT', { publicKey: sub[active.activeAccount].publicKey, index: active.activeAccount });
                }
              });
            });
            // }
          }
          browser.storage.local.get('confirmSeed').then(seed => {
            if (seed.hasOwnProperty('confirmSeed') && seed.confirmSeed == false) {
              this.$router.push('/seed');
            }
          });
          // if (data.isLogged && data.hasOwnProperty('isLogged')) {
          if (user.userAccount && user.hasOwnProperty('userAccount')) {
            this.$store.commit('SWITCH_LOGGED_IN', true);
            redirectAfterLogin(this);
          }
        });
      });
    },
    generwateWalletIntro() {
      this.$router.push('/intro');
    },
    importAccount() {
      this.$router.push('/importAccount');
    },
  }
};
</script>
