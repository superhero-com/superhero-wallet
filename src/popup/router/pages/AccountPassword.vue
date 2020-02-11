<template>
  <div>
    <main>
      <div class="popup">
        <div v-if="!loading">
          <h3>{{ title }}</h3>
          <ae-button @click="navigateToIndex" class="closeBtn">
            <ae-icon name="close" />
          </ae-button>
          <password v-if="confirmPassword" v-model="accountPassword" strength-meter-class="passwordStrengthMeter" :strength-meter-only="true" @score="getScore" />
          <ae-input placeholder="" class="my-2" label="Password" v-bind="inputError">
            <input
              type="password"
              class="ae-input"
              :min="minPasswordLength"
              v-model="accountPassword"
              slot-scope="{ context }"
              @focus="context.focus = true"
              @blur="context.focus = false"
            />
            <ae-toolbar v-if="errorMsg == 'length'" slot="footer">{{ $t('pages.accountPassword.passwordSymbolsError') }}{{ minPasswordLength }}</ae-toolbar>
            <ae-toolbar v-if="errorMsg == 'weak'" slot="footer">{{ $t('pages.accountPassword.weakPasswordError') }}</ae-toolbar>
            <ae-toolbar v-if="loginError" slot="footer">{{ $t('pages.accountPassword.incorrectPasswordError') }}</ae-toolbar>
          </ae-input>
          <ae-input v-if="confirmPassword" placeholder="" class="my-2" label="Repeat Password" v-bind="inputError">
            <input
              type="password"
              class="ae-input"
              :min="minPasswordLength"
              v-model="confirmAccountPassword"
              slot-scope="{ context }"
              @focus="context.focus = true"
              @blur="context.focus = false"
            />
            <ae-toolbar v-if="errorMsg == 'match'" slot="footer">{{ $t('pages.accountPassword.passwordDoesntMatchError') }} </ae-toolbar>
          </ae-input>
          <ae-button face="round" extend fill="primary" @click="clickAction({ accountPassword, data, confirmAccountPassword, termsAgreed })">{{ buttonTitle }}</ae-button>
        </div>
        <Loader size="small" :loading="loading" v-bind="{ content: $t('pages.accountPassword.securingAccount') }"></Loader>
      </div>
    </main>
  </div>
</template>
<script>
import { mnemonicToSeed } from '@aeternity/bip39';
import Password from 'vue-password-strength-meter';
import { mapGetters } from 'vuex';
import { addressGenerator, encryptMnemonic } from '../../utils/address-generator';
import { MINPASSWORDLENGTH } from '../../utils/constants';
import { redirectAfterLogin } from '../../utils/helper';

export default {
  props: ['data', 'confirmPassword', 'buttonTitle', 'type', 'title', 'termsAgreed'],
  components: { Password },
  data() {
    return {
      accountPassword: '',
      confirmAccountPassword: '',
      inputError: {},
      loading: false,
      errorMsg: '',
      loginError: false,
      minPasswordLength: MINPASSWORDLENGTH,
      passwordScore: 0,
    };
  },
  computed: {
    ...mapGetters(['tokens']),
  },
  methods: {
    navigateToIndex() {
      this.$router.push('/');
    },
    getScore(score) {
      this.passwordScore = score;
    },
    clickAction({ accountPassword, data, confirmAccountPassword, termsAgreed }) {
      if (
        (this.confirmPassword && accountPassword !== confirmAccountPassword) ||
        accountPassword.length < this.minPasswordLength ||
        (this.confirmPassword && confirmAccountPassword < this.minPasswordLength)
      ) {
        this.inputError = { error: '' };
        if (accountPassword.length < this.minPasswordLength || (this.confirmPassword && confirmAccountPassword < this.minPasswordLength)) {
          this.errorMsg = 'length';
        }
        if (this.confirmPassword && accountPassword !== confirmAccountPassword) {
          this.errorMsg = 'match';
        }
        if (this.passwordScore < 3) {
          this.errorMsg = 'weak';
        }
        return;
      }
      this.inputError = {};
      if (this.type == 'privateKey') {
        this.importPrivateKey({ accountPassword, data, termsAgreed });
      } else if (this.type == 'seedPhrase') {
        this.importSeedPhrase({ accountPassword, data, termsAgreed });
      } else if (this.type == 'generateEncrypt') {
        this.generateAddress({ accountPassword, termsAgreed });
      } else if (this.type == 'login') {
        this.login({ accountPassword });
      }
    },
    importPrivateKey: async function importPrivateKey({ accountPassword, data, termsAgreed }) {
      this.loading = true;
      const address = await this.$store.dispatch('generateWallet', { seed: data });
      const keyPair = await addressGenerator.importPrivateKey(accountPassword, data, address);
      if (keyPair) {
        browser.storage.local.remove('encryptedSeed');
        this.setLogin(keyPair, false, termsAgreed, accountPassword);
      }
    },
    importSeedPhrase: async function importSeedPhrase({ accountPassword, data, termsAgreed }) {
      this.loading = true;
      const seed = mnemonicToSeed(data);
      // let encryptedSeed = cryptr.encrypt(data);
      const encryptedSeed = await encryptMnemonic(data, accountPassword);
      const address = await this.$store.dispatch('generateWallet', { seed });
      const keyPair = await addressGenerator.generateKeyPair(accountPassword, seed.toString('hex'), address);
      if (keyPair) {
        browser.storage.local.set({ encryptedSeed }).then(async () => {
          this.setLogin(keyPair, false, termsAgreed, accountPassword);
        });
      }
    },
    importKeystore: async function importKeystore({ accountPassword, data, termsAgreed }) {
      this.loading = true;
      const encryptedPrivateKey = JSON.parse(data);
      const seed = await addressGenerator.decryptKeystore(encryptedPrivateKey, accountPassword);
      if (seed !== false) {
        const address = await this.$store.dispatch('generateWallet', { seed });
        browser.storage.local.remove('encryptedSeed');
        const keyPair = { encryptedPrivateKey: JSON.stringify(encryptedPrivateKey), publicKey: encryptedPrivateKey.public_key };
        this.setLogin(keyPair, true, termsAgreed, accountPassword);
      } else {
        this.loginError = true;
        this.errorMsg = '';
        this.inputError = { error: '' };
        this.loading = false;
      }
    },
    async setLogin(keyPair, fixAccount = false, termsAgreed, accountPassword) {
      if (fixAccount) {
        const address = await this.$store.dispatch('getAccount', { idx: 0 });
        if (address !== keyPair.publicKey) {
          keyPair.publicKey = address;
          const encPrivateKey = JSON.parse(keyPair.encryptedPrivateKey);
          encPrivateKey.publicKey = address;
          keyPair.encryptedPrivateKey = JSON.stringify(encPrivateKey);
        }
      }
      browser.storage.local.set({ userAccount: keyPair }).then(() => {
        browser.storage.local.set({ isLogged: true }).then(async () => {
          browser.storage.local.set({ termsAgreed }).then(() => {
            const sub = [];
            sub.push({
              name: 'Main account',
              publicKey: keyPair.publicKey,
              balance: 0,
              root: true,
            });
            browser.storage.local.set({ subaccounts: sub }).then(() => {
              browser.storage.local.set({ activeAccount: 0 }).then(() => {
                this.$store.commit('SET_ACTIVE_ACCOUNT', { publicKey: keyPair.publicKey, index: 0 });
              });
              this.$store.dispatch('setSubAccounts', sub).then(async () => {
                this.$store.commit('UNSET_TOKENS');
                this.$store.dispatch('setTokens', this.tokens);
                this.$store.commit('UPDATE_ACCOUNT', keyPair);
                this.$store.commit('SWITCH_LOGGED_IN', true);
                redirectAfterLogin(this);
              });
            });
          });
        });
      });
    },
    generateAddress: async function generateAddress({ accountPassword, termsAgreed }) {
      this.loading = true;
      browser.storage.local.set({ accountPassword }).then(() => {
        this.$router.push({
          name: 'seed',
          params: {
            termsAgreed,
          },
        });
      });
    },
  },
};
</script>
<style lang="scss" scoped>
.closeBtn {
  position: absolute !important;
  top: 17px;
  right: 16px;
  font-size: 18px;
  color: #000;
}
</style>
