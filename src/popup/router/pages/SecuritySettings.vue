<template>
  <div class="popup">
    <BackLink to="/account">
      {{ $t('pages.securitySettings.backToSettings') }}
    </BackLink>
    <div v-if="type == ''">
      <h3 style="text-align:center;">{{ $t('pages.securitySettings.heading') }}</h3>
      <ae-panel>
        <div class="maindiv_input-group-addon">
          <h4>{{ $t('pages.securitySettings.seedRecoveryHeading') }}</h4>
          <hr />
          <small class="sett_info">{{ $t('pages.securitySettings.seedRecoverySmall') }}</small>
          <ae-button face="round" fill="primary" class="notround settingBtn" extend @click="seedPhraseRecovery">{{ $t('pages.securitySettings.seedRecoveryBtn') }}</ae-button>
        </div>
      </ae-panel>
      <popup :popupSecondBtnClick="popup.secondBtnClick"></popup>
      <div v-if="loading" class="loading">
        <ae-loader />
      </div>
    </div>
    <Modal v-if="type == 3" :modal="modal">
      <div slot="content">
        <small v-if="seedPhrase == '' && !loading && type == '3'">{{ $t('pages.securitySettings.seedPhraseWarning') }}</small>
        <h3 v-if="seedPhrase != '' && type == '3'">{{ $t('pages.securitySettings.seedPhrase') }}</h3>
        <Alert :fill="alert.fill" :show="alert.show && !loading">
          <div slot="content">
            {{ alert.content }}
          </div>
        </Alert>
        <ae-panel style="box-shadow: #c6c3c3 0px 0px 20px;margin:0">
          <p style="word-spacing: 10px;">{{ seedPhrase }}</p>
          <ae-button style="float: right;margin: 10px 0 30px 0;" face="toolbar" v-clipboard:copy="seedPhrase">
            <ae-icon name="copy" />
            {{ $t('pages.securitySettings.copy') }}
          </ae-button>
        </ae-panel>
        <span>
          Back up your seed phrase on a piece of paper or file that no one except you will ever see. Make multiple copies.
        </span>
        <p>Do not lose this seed phrase!</p>
        <small>To make sure you got it right, you will be asked to recreate this seed phrase in the next screen.</small>
        <button @click="verifySeed" class="primary-button">Verify seed</button>
        <button @click="navigateToAccount" class="primary-button">I've already done this</button>
        <popup :popupSecondBtnClick="popup.secondBtnClick"></popup>
      </div>
    </Modal>
    <div v-if="type == 4">
      <h3 class="phraseTitle">{{ $t('pages.seedPhrase.confirmSeedPhrase') }}</h3>
      <ae-phraser>
        <ae-badge
          class="seedBadge"
          :class="{ selected: seed.selected }"
          v-for="(seed, index) in seeds"
          v-bind:key="seed.id"
          @click.native="selectSeed(seed.name, index, seed.id)"
          >{{ seed.name }}</ae-badge
        >
      </ae-phraser>
      <div class="phraseSubTitle">{{ $t('pages.seedPhrase.recoveryPhrase') }}</div>
      <ae-phraser v-if="selectedSeed.length == 0">
        <ae-badge class="seedBadge selected">{{ $t('pages.seedPhrase.first') }}</ae-badge>
        <ae-badge class="seedBadge selected">{{ $t('pages.seedPhrase.second') }}</ae-badge>
        <ae-badge class="seedBadge selected">{{ $t('pages.seedPhrase.third') }}</ae-badge>
        <ae-badge class="seedBadge selected">...</ae-badge>
      </ae-phraser>
      <ae-phraser v-bind="seedError">
        <ae-badge class="seedBadge" v-for="(seed, index) in selectedSeed" v-bind:key="seed.id" @click.native="removeSeed(seed.parent, index)"
          >{{ seed.name }} <ae-icon name="close" class="seedClose"
        /></ae-badge>
      </ae-phraser>
      <button @click="verifyLastStep" class="primary-button" style="width:50%">Verify</button>
    </div>
    <div v-if="seed_verified && type == 5">
      <ae-icon style="color:#e911ff; font-size:100px;" name="check" />
      <p>Seed phrase confirmed.</p>
      <button @click="navigateToAccount" class="primary-button">Back to Dashboard</button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { getHdWalletAccount } from '../../utils/hdWallet';
import { decrypt } from '../../utils/keystore';
import { addressGenerator, decryptMnemonic } from '../../utils/address-generator';
import { shuffleArray } from '../../utils/helper';

export default {
  data() {
    return {
      loading: false,
      modal: {
        visible: false,
        title: '',
      },
      seedPhrase: '',
      alert: {
        fill: 'neutral',
        show: false,
        content: '',
      },
      type: '',
      seeds: [
        { id: 0, name: 'volcano', selected: false },
        { id: 1, name: 'entire', selected: false },
        { id: 2, name: 'magnet', selected: false },
        { id: 3, name: 'glow', selected: false },
        { id: 4, name: 'zero', selected: false },
        { id: 5, name: 'crack', selected: false },
        { id: 6, name: 'arena', selected: false },
        { id: 7, name: 'episode', selected: false },
        { id: 8, name: 'shrimp', selected: false },
        { id: 9, name: 'buffalo', selected: false },
        { id: 10, name: 'tiny', selected: false },
        { id: 11, name: 'aunt', selected: false },
      ],
      selectedSeed: [],
      seedError: {},
      seed_verified: false,
    };
  },
  computed: {
    ...mapGetters(['account', 'balance', 'network', 'current', 'transactions', 'subaccounts', 'wallet', 'activeAccountName', 'activeAccount', 'popup']),
  },
  created() {},
  methods: {
    seedPhraseRecovery() {
      this.type = '3';
      this.modal.visible = true;
      this.modal.title = this.$t('pages.securitySettings.showSeedPhrase');
      this.loading = true;
      browser.storage.local.get('mnemonic').then(async seed => {
        this.seedPhrase = seed.mnemonic;
        this.setAlertData('alternative', true, seed.mnemonic);
        const seedPhraseToArray = seed.mnemonic.split(' ');
        this.seeds.forEach((item, index) => {
          item.name = seedPhraseToArray[index];
        });
      });
    },
    navigateToAccount() {
      this.$router.push('/account');
    },
    verifySeed() {
      this.type = '4';
      shuffleArray(this.seeds);
    },
    setAlertData(fill, show, content) {
      this.alert.fill = fill;
      this.alert.show = show;
      this.alert.content = content;
    },
    selectSeed(seed, index, id) {
      if (!this.selectedSeed.find(s => s.parent == id)) {
        this.selectedSeed.push({ name: seed, parent: id });
        this.seeds.find(s => s.id == id).selected = true;
      }
      if (this.selectedSeed.length == 12) {
        this.buttonFill = 'primary';
      } else {
        this.buttonFill = '';
      }
    },
    removeSeed(parent, index) {
      this.seeds.find(s => s.id == parent).selected = false;
      this.selectedSeed.splice(index, 1);
      if (this.selectedSeed.length == 12) {
        this.buttonFill = 'primary';
      } else {
        this.buttonFill = '';
      }
      this.seedError = {};
    },
    verifyLastStep() {
      const seed = this.seeds.slice();
      const sorted = seed.sort((a, b) => (a.id > b.id ? 1 : -1));
      const originalSeed = sorted.map(seed => seed.name).join(',');
      const selectSeed = this.selectedSeed.map(seed => seed.name).join(',');
      if (this.selectedSeed.length == 12) {
        if (originalSeed != selectSeed) {
          this.seedError = { error: 'Oops! Incorrect seed phrase!' };
        } else {
          this.seedError = {};
          this.loading = true;
          this.seed_verified = true;
          this.type = '5';
          browser.storage.local.set({ backed_up_Seed: true }).then(() => {});
        }
      } else {
        this.seedError = { error: 'Oops! Incorrect length of words!' };
      }
    },
  },
};
</script>

<style lang="scss">
.primary-button {
  background: #4f4f4f;
  color: #fff;
  margin: 1rem auto 0;
  padding: 1rem;
  font-weight: bold;
  border-radius: 10px;
}
.regbtn {
  background: #ff0d6a;
  color: #ffffff;
  float: right;
  width: 19%;
  border-radius: 0 !important;
}
.maindiv_input-group-addon {
  text-align: center;
}
.maindiv_input-group-addon h4 {
  text-align: left;
  margin: 0 !important;
}
.input-group-addon {
  background: #ececec;
  border: 1px solid #ccc;
  width: 79%;
  height: 56px;
  float: left;
}
.addon-input {
  width: 75%;
  outline: none;
  color: #828282;
  padding: 0;
  height: 55px;
  text-indent: 5px;
  caret-color: #ff0d6a;
}
.addon-lbl {
  font-weight: 600;
  color: #828282;
}
input:active,
input:focus {
  border: none;
  outline: none;
}
.notround {
  border-radius: 0 !important;
}
small {
  word-break: break-word;
}
.seedBadge {
  user-select: unset;
  cursor: pointer;
  border: 2px solid #edf3f7;
  .seedClose {
    margin-left: 5px;
  }
  &.selected {
    opacity: 0.4;
    cursor: unset;
    background: transparent;
    border: 2px solid #c1c1c1;
  }
}
</style>
