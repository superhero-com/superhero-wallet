<template>
  <div>
    <main>
      <div class="wrapper">
        <p>{{ $t('pages.index.heading') }}</p>
        <div class="logo-center">
          <img :src="logo" alt="Waellet logo" />
        </div>
      </div>
    </main>
    <Loader size="small" :loading="loading" v-bind="{'content':$t('pages.index.securingAccount')}"></Loader>
    <footer v-if="!loading">
      <div class="wrapper">
        <div v-if="account.encryptedPrivateKey">
          <ae-input placeholder class="my-2" label="Password" v-bind="inputError">
            <input
              type="password"
              class="ae-input"
              min="4"
              v-model="accountPassword"
              slot-scope="{ context }"
              @focus="context.focus = true"
              @blur="context.focus = false"
            />
            <ae-toolbar
              v-if="errorMsg == 'length'"
              slot="footer"
            >{{ $t('pages.index.passwordError') }}</ae-toolbar>
            <ae-toolbar v-if="loginError" slot="footer">{{ $t('pages.index.incorrectPasswordError') }}</ae-toolbar>
          </ae-input>
          <ae-button
            face="round"
            extend
            fill="primary"
            class="loginBtn"
            @click="login({accountPassword})"
          >{{ $t('pages.index.loginButton') }}</ae-button>
          <ae-divider />
        </div>
        
        <ae-check v-if="termsAgreedOrNot != true || termsAgreedOrNot == undefined" class="termsCheck" v-model="terms" value="1" type="checkbox">
          <div class="termsHolder">
            {{ $t('pages.index.term1') }}<a href="#" @click="goToTermsOfService"> {{ $t('pages.index.term2') }}</a> and <a href="#" @click="goToPrivacyPolicy"> {{ $t('pages.index.term3') }}</a>
          </div>
        </ae-check>
        <ae-button
          face="round"
          v-if="!account.encryptedPrivateKey"
          fill="primary"
          class="mb-1"
          :class="[ terms[0] != 1 && termsAgreedOrNot != true ? 'disabled' : '' ]"
          extend
          @click="generateAddress"
        >{{ $t('pages.index.generateWallet') }}</ae-button>
        <ae-button
          face="round"
          extend
          :class="[ terms[0] != 1 && termsAgreedOrNot != true ? 'disabled' : '' ]"
          @click="openImportModal"
          class="importBtn"
        >{{ $t('pages.index.importPrivateKey') }}</ae-button>
      </div>
    </footer>

    <ae-modal v-if="modalVisible" @close="modalVisible = false">
      <h2 class="modaltitle">{{ $t('pages.index.importWaellet') }}</h2>

      <div class="tabs">
        <span
          @click="switchImportType('privateKey')"
          :class="{'tab-active':importType =='privateKey'}"
        >{{ $t('pages.index.privateKey') }}</span>
        <span
          @click="switchImportType('keystore')"
          :class="{'tab-active':importType == 'keystore'}"
        >{{ $t('pages.index.keystoreJson') }}</span>
        <span
          @click="switchImportType('seedPhrase')"
          :class="{'tab-active':importType == 'seedPhrase'}"
        >{{ $t('pages.index.seedPhrase') }}</span>
      </div>

      <ae-input
        label="Secret Key"
        v-if="importType == 'privateKey'"
        v-model="privateKey"
        v-bind="inputError"
        class="my-2"
      >
        <ae-toolbar slot="footer">{{errorMsg}}</ae-toolbar>
      </ae-input>

      <div
        v-if="importType == 'keystore'"
        class="walletFileHolder"
        :class="{'walletFileHolderError':inputError.hasOwnProperty('error')}"
      >
        <label for="walletFile" class="customFileUpload my-2 ae-input-box">
          <div class="file-label">{{ $t('pages.index.chooseFile') }}</div>
          <div class="file-input">{{walletFile !='' ? walletFile.name : ''}}</div>
          <div class="file-toolbar">{{errorMsg}}</div>
        </label>

        <input type="file" id="walletFile" @change="uploadWallet" ref="walletFile" class="ae-input" />
      </div>

      <div v-if="importType == 'seedPhrase'">
        <p
          class="importTitle"
        >{{ $t('pages.index.enterSeedPhrase') }}</p>
        <ae-input label="Seed phrase" class="my-2" v-bind="inputError">
          <textarea
            class="ae-input textarea"
            v-model="seedPhrase"
            slot-scope="{ context }"
            @focus="context.focus = true"
            @blur="context.focus = false"
          />
          <ae-toolbar slot="footer">{{errorMsg}}</ae-toolbar>
        </ae-input>
      </div>

      <ae-button
        face="round"
        extend
        fill="primary"
        @click="importShowPassword({importType,privateKey,seedPhrase})"
      >{{ $t('pages.index.continueButton') }}</ae-button>
    </ae-modal>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { addressGenerator } from '../../utils/address-generator';
import { decrypt } from '../../utils/keystore';
import { fetchData, redirectAfterLogin, parseFromStorage } from '../../utils/helper';
import { generateMnemonic, mnemonicToSeed, validateMnemonic } from '@aeternity/bip39';
import { generateHdWallet, getHdWalletAccount } from '../../utils/hdWallet';

export default {
  name: 'Home',
  data() {
    return {
      loading: false,
      modalAskVisible: true,
      modalVisible: false,
      logo: browser.runtime.getURL('../../../icons/icon_128.png'),
      privateKey: '',
      seedPhrase: '',
      importType: 'privateKey',
      inputError: {},
      walletFile: '',
      errorMsg: 'This field is requried!',
      errorMsg: '',
      loginError: false,
      accountPassword: '',
      imported: false,
      termsIndex: 0,
      terms: [],
      termsAgreedOrNot: false
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
    goToPrivacyPolicy() {
      this.$router.push('/privacyPolicy');
    },
    goToTermsOfService() {
      this.$router.push('/termsOfService');
    },
    init() {
      // check if there is an account generated already
      // browser.storage.local.set({userAccount: ''}).then(() => {});
      // browser.storage.local.set({isLogged: ''}).then(() => {});
      // browser.storage.local.set({confirmSeed: true}).then(() => {});
      // browser.storage.local.set({mnemonic: ''}).then(() => {});
      browser.storage.local.remove('processingTx').then(() => {});
      var newTab = false;
      browser.storage.local.get('allowTracking').then(result => {
        if (result.hasOwnProperty('allowTracking')) {
          this.modalAskVisible = false;
        }
      });
      browser.storage.local.get('showAeppPopup').then(aepp => {
        browser.storage.local.get('pendingTransaction').then(pendingTx => {
          browser.storage.local.get('isLogged').then(data => {
            browser.storage.local.get('userAccount').then(async user => {
              if (user.userAccount && user.hasOwnProperty('userAccount')) {
                try {
                  user.userAccount.encryptedPrivateKey = JSON.parse(user.userAccount.encryptedPrivateKey);
                } catch (e) {
                  user.userAccount.encryptedPrivateKey = JSON.stringify(user.userAccount.encryptedPrivateKey);
                }
                this.$store.commit('UPDATE_ACCOUNT', user.userAccount);
                if (data.isLogged && data.hasOwnProperty('isLogged')) {
                  browser.storage.local.get('subaccounts').then(subaccounts => {
                    let sub = [];
                    if (
                      !subaccounts.hasOwnProperty('subaccounts') ||
                      subaccounts.subaccounts == '' ||
                      (typeof subaccounts.subaccounts == 'object' && !subaccounts.subaccounts.find(f => f.publicKey == user.userAccount.publicKey))
                    ) {
                      sub.push({
                        name: typeof subaccounts.subaccounts != 'undefined' ? subaccounts.subaccounts.name : 'Main account',
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

                  // Get user networks
                  browser.storage.local.get('userNetworks').then(usernetworks => {
                    if (usernetworks.hasOwnProperty('userNetworks')) {
                      usernetworks.userNetworks.forEach(data => {
                        this.$store.state.network[data.name] = data;
                      });
                      this.$store.dispatch('setUserNetworks', usernetworks.userNetworks);
                    }
                  });
                }
              }
              browser.storage.local.get('confirmSeed').then(seed => {
                if (seed.hasOwnProperty('confirmSeed') && seed.confirmSeed == false) {
                  this.$router.push('/seed');
                  return;
                }
              });
              if (data.isLogged && data.hasOwnProperty('isLogged')) {
                  this.$store.commit('SWITCH_LOGGED_IN', true);
                  redirectAfterLogin(this);
              }
            });
          });
        });
      });
    },
    generateAddress: async function generateAddress({ dispatch }) {
      this.$router.push({
        name: 'password',
        params: {
          confirmPassword: true,
          data: '',
          buttonTitle: 'Continue',
          type: 'generateEncrypt',
          title: 'Protect Account with Password',
          termsAgreed: true
        },
      });
    },
    switchImportType(type) {
      this.importType = type;
      this.errorMsg = 'This field is requried! ';
      this.inputError = {};
    },
    checkSeed(seed) {
      return validateMnemonic(seed);
    },
    uploadWallet() {
      this.walletFile = this.$refs.walletFile.files[0];
    },
    importShowPassword({ importType, privateKey, seedPhrase }) {
      if (importType == 'privateKey') {
        if (privateKey.length == 128) {
          this.$router.push({
            name: 'password',
            params: {
              confirmPassword: true,
              data: privateKey,
              buttonTitle: 'Import',
              type: importType,
              title: 'Import From Private Key',
              termsAgreed: true
            },
          });
          this.modalVisible = false;
          this.inputError = {};
          this.imported = true;
        } else {
          this.inputError = { error: '' };
          this.errorMsg = 'Private key is incorrect! ';
        }
      } else if (importType == 'seedPhrase') {
        let seed = seedPhrase.split(' ');
        if (seed.length >= 12 && seed.length <= 24 && this.checkSeed(seedPhrase)) {
          this.$router.push({
            name: 'password',
            params: {
              confirmPassword: true,
              data: seedPhrase,
              buttonTitle: 'Restore',
              type: importType,
              title: 'Import From Seed Phrase',
              termsAgreed: true
            },
          });
          this.modalVisible = false;
          this.inputError = {};
          this.imported = true;
        } else {
          this.inputError = { error: '' };
          this.errorMsg = 'Incorrect seed phrase! ';
        }
      } else if (importType == 'keystore') {
        if (this.walletFile != '') {
          let reader = new FileReader();
          let context = this;
          reader.onload = function(e) {
            try {
              let keystore = JSON.parse(e.target.result);
              context.inputError = {};
              if (keystore.crypto.ciphertext.length && keystore.crypto.cipher_params.nonce && keystore.crypto.kdf_params.salt.length) {
                context.$router.push({
                  name: 'password',
                  params: {
                    confirmPassword: false,
                    data: e.target.result,
                    buttonTitle: 'Import',
                    type: importType,
                    title: 'Import From Keystore.json',
                    termsAgreed: true
                  },
                });
                context.modalVisible = false;
              } else {
                context.inputError = { error: '' };
                context.errorMsg = 'Invalid file format! ';
              }
            } catch (err) {
              context.inputError = { error: '' };
              context.errorMsg = 'Invalid file format! ';
            }
          };
          reader.readAsText(this.walletFile);
          this.imported = true;
        } else {
          this.inputError = { error: '' };
          this.errorMsg = 'Plese upload keystore.json file! ';
        }
      }
    },
    openImportModal() {
      this.modalVisible = true;
      this.inputError = {};
      this.errorMsg = 'This field is requried! ';
    },
    login: async function login({ accountPassword }) {
      let context = this;
      if (accountPassword.length >= 4) {
        context.loading = true;
        browser.storage.local.get('userAccount').then(async user => {
          this.errorMsg = '';
          if (user.userAccount && user.hasOwnProperty('userAccount')) {
            let encPrivateKey = user.userAccount.encryptedPrivateKey;
            try {
              JSON.parse(user.userAccount.encryptedPrivateKey);
            } catch (e) {
              user.userAccount.encryptedPrivateKey = JSON.stringify(user.userAccount.encryptedPrivateKey);
              encPrivateKey = JSON.stringify(user.userAccount.encryptedPrivateKey);
            }
            let encryptedPrivateKey = JSON.parse(user.userAccount.encryptedPrivateKey);
            let unlock = await this.$store.dispatch('unlockWallet', { accountPassword, encryptedPrivateKey  })
            user.userAccount.encryptedPrivateKey = JSON.stringify(user.userAccount.encryptedPrivateKey);
            
            if (unlock.decrypt) {
              this.loginError = false;
              this.inputError = {};
              let address = unlock.address;
              let sub = [];
              let account = {
                name: 'Main account',
                publicKey: address,
                balance: 0,
                root: true,
              };
              browser.storage.local.set({ isLogged: true }).then(() => {
                  if (address !== user.userAccount.publicKey) {
                    user.userAccount.publicKey = address;
                    user.userAccount.encryptedPrivateKey = encPrivateKey;
                    browser.storage.local.set({ userAccount: user.userAccount }).then(() => {
                      sub.push(account);
                      browser.storage.local.set({ subaccounts: sub }).then(() => {
                        browser.storage.local.set({ activeAccount: 0 }).then(async () => {
                          this.$store.commit('SET_ACTIVE_ACCOUNT', { publicKey: account.publicKey, index: 0 });
                          this.$store.dispatch('setSubAccounts', sub);
                          this.$store.commit('SWITCH_LOGGED_IN', true);
                          this.$router.push('/account');
                        });
                      });
                    });
                    return;
                  }
                  browser.storage.local.get('subaccounts').then(subaccounts => {
                    if ((subaccounts.hasOwnProperty('subaccounts') && subaccounts.subaccounts == '') || !subaccounts.hasOwnProperty('subaccounts')) {
                      sub.push(account);
                      browser.storage.local.set({ subaccounts: sub }).then(() => {
                        browser.storage.local.set({ activeAccount: 0 }).then(() => {
                          this.$store.commit('SET_ACTIVE_ACCOUNT', { publicKey: account.publicKey, index: 0 });
                        });
                      });
                    } else {
                      sub = subaccounts.subaccounts;
                    }
                    this.$store.dispatch('setSubAccounts', sub).then(async () => {
                      this.$store.commit('SWITCH_LOGGED_IN', true);
                      redirectAfterLogin(this);
                    });
                  });
              });
            } else {
              this.loginError = true;
              this.inputError = { error: '' };
            }
            this.loading = false;
          }
        });
      } else {
        this.errorMsg = 'length';
        this.inputError = { error: '' };
        context.loading = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/base';

.logo-center {
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
}

#walletFile {
  display: none;
}
.walletFileHolder {
  border-left: 2px solid transparent;
  &.walletFileHolderError {
    border-left: 2px solid $input-border-color;
  }
}
.importTitle {
  font-size: 1.5rem;
  font-weight: 500;
}
.disabled {
  background: #ccc !important;
  pointer-events: none;
}
.termsCheck {
  margin-bottom: 20px;
}
.termsHolder {
  position: relative;
  margin: 0px 10px;
}
.termsHolder a {
  font-weight: bold;
}
</style>