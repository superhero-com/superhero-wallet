<template>
  <div>
    <main>
      <div class="wrapper">
        <div class="logo-center">
          <img :src="logo" alt="Waellet logo" />
        </div>
      </div>
    </main>
    <Loader size="small" :loading="loading" v-bind="{'content':$t('pages.index.securingAccount')}"></Loader>
    <footer v-if="!loading">
      <div class="wrapper">
        <ae-check v-if="termsAgreedOrNot != true || termsAgreedOrNot == undefined" class="termsCheck" v-model="terms" value="1" type="checkbox">
          <div class="termsHolder">
            {{ $t('pages.index.term1') }}<a href="#" @click="goToTermsOfService"> {{ $t('pages.index.term2') }}</a> and <a href="#" @click="goToPrivacyPolicy"> {{ $t('pages.index.term3') }}</a>
          </div>
        </ae-check>
        <!-- <ae-button
          face="round"
          fill="primary"
          class="mb-1"
          :class="[ terms[0] != 1 && termsAgreedOrNot != true ? 'disabled' : '' ]"
          extend
          @click="generwateWalletIntro"
        >{{ $t('pages.index.generateWallet') }}</ae-button>
        <ae-button
          face="round"
          extend
          :class="[ terms[0] != 1 && termsAgreedOrNot != true ? 'disabled' : '' ]"
          @click="importAccount"
          class="importBtn"
        >{{ $t('pages.index.importPrivateKey') }}</ae-button> -->
          <ae-check value="create" type="radio" name="walletType" v-model="walletType" :disabled=" terms[0] != 1 && termsAgreedOrNot != true ? true : false ">
            <div class="termsHolder">
              Generate a new wallet. <br>
              <b>Start claiming tips!</b>
            </div>
          </ae-check>
          <br><br>
          <ae-check value="import" type="radio" name="walletType" v-model="walletType" :disabled=" terms[0] != 1 && termsAgreedOrNot != true ? true : false ">
            <div class="termsHolder">
              Already have an account? <br>
              Retrieve existing account.
            </div>
          </ae-check>
          <br><br>
          <ae-button
          face="round"
          fill="primary"
          class="mb-1"
          :class="[ terms[0] != 1 && termsAgreedOrNot != true || !walletType ? 'disabled' : '' ]"
          extend
          @click="introContinue"
        >{{ $t('pages.index.continue') }}</ae-button>

        <!-- <ae-button face="round" extend>{{ $t('pages.index.continue') }}</ae-button> -->
      </div>
    </footer>
<!-- 
    <ae-modal v-if="modalVisible" @close="modalVisible = false">
      <h2 class="modaltitle">{{ $t('pages.index.importWaellet') }}</h2>

      <div class="tabs">
        <span
          @click="switchImportType('privateKey')"
          :class="{'tab-active':importType =='privateKey'}"
        >{{ $t('pages.index.privateKey') }}</span>
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
        
      </div>

      <ae-button
        face="round"
        extend
        fill="primary"
        @click="importShowPassword({importType,privateKey,seedPhrase})"
      >{{ $t('pages.index.continueButton') }}</ae-button>
    </ae-modal> -->
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { addressGenerator } from '../../utils/address-generator';
import { decrypt } from '../../utils/keystore';
import { fetchData, redirectAfterLogin, parseFromStorage } from '../../utils/helper';

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
      termsAgreedOrNot: false,
      walletType: null
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
    introContinue() {
      this.loading = true
      if(this.walletType == "create") {
        this.generwateWalletIntro()
      } else if(this.walletType == "import") {
        this.importAccount()
      }
    },
    init() {
      browser.storage.local.remove('processingTx').then(() => {});
      var newTab = false;
      browser.storage.local.get('allowTracking').then(result => {
        if (result.hasOwnProperty('allowTracking')) {
          this.modalAskVisible = false;
        }
      });
     
      browser.storage.local.get('isLogged').then(data => {

        browser.storage.local.get('userAccount').then(async user => {
          
          if (user.userAccount && user.hasOwnProperty('userAccount')) {
            console.log("ne tuk")
            this.$store.commit('UPDATE_ACCOUNT', user.userAccount);
            const address = await this.$store.dispatch('generateWallet', { seed:user.userAccount.privateKey })
            // if (data.isLogged && data.hasOwnProperty('isLogged')) {
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
            // }
          }
          browser.storage.local.get('confirmSeed').then(seed => {
            if (seed.hasOwnProperty('confirmSeed') && seed.confirmSeed == false) {
              this.$router.push('/seed');
              return;
            }
          });
          // if (data.isLogged && data.hasOwnProperty('isLogged')) {
          if (user.userAccount && user.hasOwnProperty('userAccount')){
              this.$store.commit('SWITCH_LOGGED_IN', true);
              redirectAfterLogin(this);
          }
        });
      });
    },
    generwateWalletIntro () {
      this.$router.push('/intro');
    },
    importAccount() {
      this.$router.push('/importAccount')
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
    }
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