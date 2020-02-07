<template>
  <div>
    <main>
      <div class="popup" v-if="!loading">
        <div class="attentionHolder" v-if="step == 1">
          <h1><div>!</div></h1>
          <h4>{{ $t('pages.seedPhrase.attentionMsg') }}</h4>
          <h4 class="mt-3">{{ $t('pages.seedPhrase.tips') }}</h4>
          <ul>
            <li>{{ $t('pages.seedPhrase.tip1') }}</li>
            <li>{{ $t('pages.seedPhrase.tip2') }}</li>
            <li>{{ $t('pages.seedPhrase.tip3') }}</li>
          </ul>
        </div>
        <div v-if="step == 2">
          <h3 style="margin: 0 0 1rem 0;" class="phraseTitle">{{ $t('pages.seedPhrase.keepCarefully') }}</h3>
          <div class="seeds-container">
            <div class="col" v-for="column in columns" v-bind:key="column.id">
              <ae-badge v-for="seed in column" v-bind:key="seed.id">{{ seed.id + 1 }} {{ seed.name }}</ae-badge>
            </div>
          </div>
          <progress class="seedProgress" :value="progress" max="100"></progress>
        </div>
        <div v-if="step == 3">
          <h3 class="phraseTitle">{{ $t('pages.seedPhrase.confirmSeedPhrase') }}</h3>
          <ae-phraser>
            <ae-badge
              class="seedBadge"
              :class="{ selected: seed.selected }"
              v-for="(seed, index) in shiffledSeed"
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
          <ae-phraser v-bind="seedError" class="mb-5">
            <ae-badge class="seedBadge" v-for="(seed, index) in selectedSeed" v-bind:key="seed.id" @click.native="removeSeed(seed.parent, index)"
              >{{ seed.name }} <ae-icon name="close" class="seedClose"
            /></ae-badge>
          </ae-phraser>
        </div>
        <ae-button extend face="round" :fill="buttonFill" class="mt-1 nextStep" @click="nextSeedStep(step, termsAgreed)">{{ buttonTitle }}</ae-button>
      </div>
      <Loader size="small" :loading="loading" v-bind="{ content: $t('pages.seedPhrase.securingAccount') }"></Loader>
      <popup :popupSecondBtnClick="popup.secondBtnClick"></popup>
    </main>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

import { generateMnemonic, mnemonicToSeed, validateMnemonic } from '@aeternity/bip39';
import { setInterval } from 'timers';
import { shuffleArray, fetchData } from '../../utils/helper';
import { addressGenerator, encryptMnemonic } from '../../utils/address-generator';
import { generateHdWallet } from '../../utils/hdWallet';

export default {
  props: ['termsAgreed'],
  data() {
    return {
      step: 1,
      buttonTitle: 'SHOW SEED PHRASE',
      buttonFill: 'primary',
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
      progress: 0,
      loading: false,
      generated: false,
    };
  },
  mounted() {
    this.generateSeeds();
    browser.storage.local.set({ confirmSeed: false }).then(() => {});
  },
  computed: {
    ...mapGetters(['popup']),
    shiffledSeed() {
      return shuffleArray(this.seeds);
    },
    seedPhraseSeparatedByComma() {
      const arr = [];
      this.seeds.forEach(element => {
        arr.push(element.name);
      });
      return arr.join(', ');
    },
    columns() {
      const columns = [];
      const mid = Math.ceil(this.seeds.length / 2);
      for (let col = 0; col < 2; col++) {
        columns.push(this.seeds.slice(col * mid, col * mid + mid));
      }
      return columns;
    },
  },
  methods: {
    generateSeeds() {
      let mnemonic;
      browser.storage.local.get('mnemonic').then(data => {
        if (data.hasOwnProperty('mnemonic') && data.mnemonic != '') {
          mnemonic = data.mnemonic;
        } else {
          mnemonic = generateMnemonic();
          browser.storage.local.set({ mnemonic }).then(() => {});
        }
        mnemonic = mnemonic.split(' ');
        this.seeds.forEach((item, index) => {
          item.name = mnemonic[index];
        });
      });
    },
    nextSeedStep: async function nextSeedStep(step, termsAgreed) {
      step += 1;
      if (step <= 3) {
        if (step == 2) {
          this.buttonTitle = 'next';
          const context = this;
          const progressChange = setInterval(() => {
            context.progress += 0.1;
            if (context.progress >= 100) {
              clearInterval(progressChange);
            }
          }, 8);
        } else if (step == 3) {
          if (this.progress >= 100) {
            this.buttonTitle = 'Confirm';
            this.buttonFill = '';
          } else {
            this.$store.dispatch('popupAlert', { name: 'account', type: 'seedFastCopy' });
            return;
          }
        }
        this.step = step;
      } else if (step == 4) {
        const seed = this.seeds.slice();
        const sorted = seed.sort((a, b) => (a.id > b.id ? 1 : -1));
        let originalSeed = sorted.map(seed => seed.name).join(',');
        const selectSeed = this.selectedSeed.map(seed => seed.name).join(',');

        if (this.selectedSeed.length == 12) {
          if (originalSeed != selectSeed) {
            this.seedError = { error: 'Oops! Not the correct order, try again' };
          } else {
            this.seedError = {};
            this.loading = true;
            browser.storage.local.get('accountPassword').then(async pass => {
              if (pass.hasOwnProperty('accountPassword') && pass.accountPassword != '') {
                originalSeed = originalSeed.replace(/,/g, ' ');
                const seed = mnemonicToSeed(originalSeed);
                // let encryptedSeed = cryptr.encrypt(originalSeed);
                const encryptedSeed = await encryptMnemonic(originalSeed, pass.accountPassword);
                const address = await this.$store.dispatch('generateWallet', { seed });
                const keyPair = await addressGenerator.generateKeyPair(pass.accountPassword, seed.toString('hex'), address);
                if (keyPair) {
                  browser.storage.local.set({ encryptedSeed }).then(async () => {
                    browser.storage.local.set({ isLogged: true }).then(async () => {
                      browser.storage.local.set({ userAccount: keyPair }).then(() => {
                        browser.storage.local.set({ termsAgreed }).then(() => {
                          this.loading = false;
                          const sub = [];
                          sub.push({
                            name: 'Main account',
                            publicKey: keyPair.publicKey,
                            balance: 0,
                            root: true,
                          });
                          browser.storage.local.set({ accountPassword: '' }).then(() => {});
                          browser.storage.local.set({ mnemonic: '' }).then(() => {});
                          browser.storage.local.set({ confirmSeed: true }).then(() => {});
                          browser.storage.local.set({ subaccounts: sub }).then(() => {
                            this.$store.dispatch('setSubAccounts', sub);
                            browser.storage.local.set({ activeAccount: 0 }).then(async () => {
                              this.$store.commit('SET_ACTIVE_ACCOUNT', { publicKey: keyPair.publicKey, index: 0 });
                              this.$store.commit('UPDATE_ACCOUNT', keyPair);
                              this.$store.commit('SWITCH_LOGGED_IN', true);
                              this.$router.push('/account');
                              this.generated = true;
                            });
                          });
                        });
                      });
                    });
                  });
                }
              }
            });
          }
        }
      }
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
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';
.attentionHolder h1 {
  color: red;
  font-size: 35px;
  margin: 0;
}
.attentionHolder h1 div {
  border: 3px solid;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin: auto;
}
.attentionHolder h3 {
  word-break: break-word;
  margin: 1.5rem 0 1.5rem;
}
.attentionHolder ul li {
  text-align: left;
}
.seeds-container {
  display: flex;
}
.col {
  margin: 5px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
.mt-1 {
  margin-top: 1rem;
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
.phraseSubTitle {
  border-left: 2px solid transparent;
  margin: 1.5rem 0 0.5rem 0;
  padding-left: 1rem;
  color: #929ca6;
}
.phraseTitle {
  margin: 0 0 3rem 0;
  padding-left: 1rem;
  font-size: 1.2rem;
  font-weight: 500;
  word-break: break-word;
}
.seedProgress {
  background: #fff;
  width: 100%;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 7px;
}
.seedProgress::-webkit-progress-bar {
  background: transparent;
  border: none;
}
.seedProgress::-webkit-progress-value {
  background: $primary-color;
}
.nextStep {
  position: fixed !important;
  bottom: 5%;
  left: 50%;
  transform: translateX(-50%) !important;
  -ms-transform: translatex(-50%) !important;
  -webkit-transform: translate(-50%) !important;
  width: 80% !important;
}
.extensionVersion {
  position: fixed;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  -ms-transform: translateX(-50%0);
  -webkit-transform: translateX(-50%);
}
</style>
