<template>
  <div class="popup">
    <!-- <div class="createWallet-holder">
      <div v-show="step === 1">
        <h2>{{ $t('pages.intro.heading') }}</h2>
        <p>(Onboarding page {{ step }} of {{ totalsteps }})</p>
        <div style="font-weight:bold;">How to CLAIM tips</div>
        <div class="text-info">
          Do so written as raising parlors spirits mr elderly. Made late in of high left hold. Carried females of up highest calling. Limits marked led silent dining her she far.
          Sir but elegance marriage dwelling likewise position old pleasure men. Dissimilar themselves simplicity no of contrasted as. Delay great day hours men. Stuff front to do
          allow to asked he.
        </div>
        <div class="dotstyle dotstyle-fillup">
          <ul>
            <li @click="step = 1" class="current"><a></a></li>
            <li @click="step = 2"><a></a></li>
            <li @click="step = 3"><a></a></li>
          </ul>
        </div>
        <button class="skip-button" @click="next()">{{ $t('pages.intro.skip') }}</button>
      </div>

      <div v-show="step === 2">
        <h2>{{ $t('pages.intro.heading') }}</h2>
        <p>(Onboarding page {{ step }} of {{ totalsteps }})</p>
        <div style="font-weight:bold;">How to SEND TIPS</div>
        <div class="text-info">
          Mr do raising article general norland my hastily. Its companions say uncommonly pianoforte favourable. Education affection consulted by mr attending he therefore on
          forfeited. High way more far feet kind evil play led. Sometimes furnished collected add for resources attention. Norland an by minuter enquire it general on towards
          forming. Adapted mrs totally company two yet conduct men.
        </div>
        <div class="dotstyle dotstyle-fillup">
          <ul>
            <li @click="step = 1"><a></a></li>
            <li @click="step = 2" class="current"><a></a></li>
            <li @click="step = 3"><a></a></li>
          </ul>
        </div>
        <button class="skip-button" @click="next()">{{ $t('pages.intro.skip') }}</button>
      </div>

      <div v-show="step === 3">
        <h2>{{ $t('pages.intro.heading') }}</h2>
        <p>(Onboarding page {{ step }} of {{ totalsteps }})</p>
        <div style="font-weight:bold;">How to ADD tokens cashing out</div>
        <div class="text-info">
          Its had resolving otherwise she contented therefore. Afford relied warmth out sir hearts sister use garden. Men day warmth formed admire former simple.
        </div>
        <div style="font-weight:bold;">Cashing Out</div>
        <div>
          Humanity declared vicinity continue supplied no an. He hastened am no property exercise of. Dissimilar comparison no terminated devonshire no literature on. Say most yet
          head room such just easy.
        </div>
        <div class="dotstyle dotstyle-fillup">
          <ul>
            <li @click="step = 1"><a></a></li>
            <li @click="step = 2"><a></a></li>
            <li @click="step = 3" class="current"><a></a></li>
          </ul>
        </div>
        <button class="skip-button" @click="next()">{{ $t('pages.intro.skip') }}</button>
      </div>

      <div v-show="step === 4">
        <div class="actions flex flex-align-center">
          <button @click="step = 3" class="back-button">
            <i data-v-1e70ab95 data-v-521427f6 class="ae-icon back-icon ae-icon-left-more"></i>
          </button>
        </div>
        <div class="text-info">
          <p><b>Your waellet has been created!</b></p>
          <b style="display:block;">Welcome to fairer Internet.</b>
          This wallet was created specifically so that no one but you will have control over your funds - or your ability to receive them.
          <b style="display:block;">Ever.</b>

          <small>
            Unlike other monetization platforms and payment systems, the creators of this wallet cannot - and can never take away your ability to receive tips from your followers
            and supporters.
          </small>
        </div>
        <p style="bottom: 50px; color: rgb(235, 88, 250); position: absolute; margin: 0 auto; width: 100%;"><b>Enjoy your autonomy</b></p>
        <button @click="createWallet" class="createWallet-button">Go to Dashboard</button>
      </div>
    </div> -->
  </div>
</template>

<script>
import { generateMnemonic, mnemonicToSeed, validateMnemonic } from '@aeternity/bip39';

export default {
  data() {
    return {
      step: 1,
      totalsteps: 4,
      mnemonic: null,
    };
  },
  async created() {
    this.createWallet();
  },
  methods: {
    async createWallet() {
      this.mnemonic = generateMnemonic();
      const seed = mnemonicToSeed(this.mnemonic).toString('hex');
      const address = await this.$store.dispatch('generateWallet', { seed });
      await browser.storage.local.set({ mnemonic: this.mnemonic });
      const keypair = {
        publicKey: address,
        privateKey: seed,
      };
      this.$store.dispatch('setLogin', { keypair });
    },
    prev() {
      this.step--;
    },
    next() {
      if (this.step <= this.totalsteps) {
        this.step++;
      } else if (this.step == this.totalsteps) {
        return false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.createWallet-holder {
  position: relative;
  height: 80vh;
}
.createWallet-holder .skip-button {
  font-style: italic;
  text-transform: uppercase;
  left: 0;
  right: 0;
  bottom: 15px;
  position: absolute;
  margin: 0 auto;
  font-size: 25px;
}
.createWallet-holder .text-info {
  margin: 10px;
}
.createWallet-button {
  background: #4f4f4f;
  color: #fff;
  position: absolute;
  bottom: 0;
  margin: 0 auto;
  left: 0;
  right: 0;
  padding: 1rem;
  font-weight: bold;
  border-radius: 10px;
}
.dotstyle {
  position: absolute;
  bottom: 50px;
  left: 0;
  right: 0;
  margin: 0 auto;
}
.dotstyle ul {
  position: relative;
  display: inline-block;
  margin: 0;
  padding: 0;
  list-style: none;
  cursor: default;
}

.dotstyle li {
  position: relative;
  display: block;
  float: left;
  margin: 0 16px;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.dotstyle li a {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  outline: none;
  border-radius: 50%;
  text-indent: -999em;
  cursor: pointer;
  position: absolute;
}
/* Fill up */
.dotstyle-fillup li a {
  overflow: hidden;
  background-color: #ccc;
  transition: background 0.3s;
}

.dotstyle-fillup li a::after {
  content: '';
  position: absolute;
  bottom: 0;
  height: 0;
  left: 0;
  width: 100%;
  // background-color: #fff;
  box-shadow: 0 0 1px rgb(172, 172, 172);
  transition: height 0.3s;
}

.dotstyle-fillup li a:hover,
.dotstyle-fillup li a:focus {
  background-color: rgba(0, 0, 0, 0.2);
}

.dotstyle-fillup li.current a {
  background-color: #7d7d7d;
}
.dotstyle-fillup li.current a::after {
  height: 100%;
}
</style>
