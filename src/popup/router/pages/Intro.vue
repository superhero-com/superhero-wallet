<template>
  <div class="popup">
    <div class="createWallet-holder" >
      <div v-show="step === 1">
        <h2><Claim /> Receive <span class="aeid">æid</span></h2>
        <div class="text-info">
          for creating great content, engaging in meaningful discussions, curating good content from others, launching causes for humanity, and for just being a wonderful human being.
        </div>
        <div class="dotstyle dotstyle-fillup">
          <ul>
            <li @click="step = 1" class="current"><a></a></li>
            <li @click="step = 2"><a></a></li>
            <li @click="step = 3"><a></a></li>
          </ul>
          <button class="skip-button" @click="next()">{{ $t('pages.intro.skip') }}</button>
        </div>
      </div>

      <div v-show="step === 2">
        <h2><Heart /> Send <span class="aeid">æid</span></h2>
        <div class="text-info">
          to great content creators online, humanitarian causes, and other awesome human beings—for whatever reason.
        </div>
        <div class="dotstyle dotstyle-fillup">
          <ul>
            <li @click="step = 1"><a></a></li>
            <li @click="step = 2" class="current"><a></a></li>
            <li @click="step = 3"><a></a></li>
          </ul>
          <button class="skip-button" @click="next()">{{ $t('pages.intro.skip') }}</button>
        </div>
      </div>

      <div v-show="step === 3">
        <div class="text-info">
          This wallet does not—and will never take commissions off the <span class="aeid">æid</span> you send or receive. Corona was created specifically so that no one but you will have control over your funds.
        </div>
        <div style="float:left;margin-top:2rem;">
          Ever.
        </div>
        <div class="dotstyle dotstyle-fillup">
          <ul>
            <li @click="step = 1"><a></a></li>
            <li @click="step = 2"><a></a></li>
            <li @click="step = 3" class="current"><a></a></li>
          </ul>
          <Button @click="createWallet">{{ $t('pages.intro.generateWallet') }}</Button>
        </div>
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
    </div>
  </div>
</template>

<script>
import { generateMnemonic, mnemonicToSeed } from '@aeternity/bip39';
import Claim from '../../../icons/claim.svg';
import Heart from '../../../icons/heart.svg';
import Button from '../components/Button'
export default {
  components: {
    Claim,
    Heart,
    Button
  },
  data() {
    return {
      step: 1,
      totalsteps: 4,
      mnemonic: null,
    };
  },
  async created() {
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
@import '../../../common/variables';
.createWallet-holder {
  position: relative;
  height: 80vh;
  padding-top: 40px;
  h2 {
    display: flex;
    justify-content: center;
    font-size: 18px;
    svg {
      margin-right: 10px;
    }
  }
  .aeid {
    color: $secondary-color !important ;
  }
  .text-info {
    margin: 10px 0 0 0;
    color: $text-color !important;
  }
  .skip-button {
    color: $accent-color !important;
    font-size: 18px;
    margin-top: 30px;
    text-decoration: underline;
    width: 100%;
  }
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
  position: fixed;
  left: 0;
  right: 0;
  top: 50%;
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
  background-color: $text-color !important;
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
  background-color: $secondary-color !important;
}
.dotstyle-fillup li.current a::after {
  height: 100%;
}
</style>
