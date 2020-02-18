<template>
  <div class="popup">
    <div class="createWallet-holder">
      <div v-show="step === 1">
        <h2>
          <Claim /> {{ $t('pages.intro.receive') }} <span class="ml-10 secondary-text"> {{ $t('pages.appVUE.aeid') }} </span>
        </h2>
        <div class="text-info">
          <span>
            {{ $t('pages.intro.step1text') }}
          </span>
        </div>
      </div>

      <div v-show="step === 2">
        <h2>
          <Heart /> {{ $t('pages.send.send') }} <span class="ml-10 secondary-text">{{ $t('pages.appVUE.aeid') }}</span>
        </h2>
        <div class="text-info">
          <span>
            {{ $t('pages.intro.step2text') }}
          </span>
        </div>
      </div>

      <div v-show="step === 3">
        <div class="text-info">
          <span>
            {{ $t('pages.intro.step3text-1') }} <span class="secondary-text aeid">{{ $t('pages.appVUE.aeid') }}</span> {{ $t('pages.intro.step3text-2') }}
          </span>
        </div>
        <div class="mt-32 text-left">
          {{ $t('pages.intro.ever') }}
        </div>
      </div>

      <div class="dotstyle dotstyle-fillup" v-show="step < 4">
        <LeftArrow @click="step = step - 1" class="left-arrow" v-show="step > 1" />
        <ul>
          <li @click="step = 1" :class="step === 1 ? 'current' : ''"><a></a></li>
          <li @click="step = 2" :class="step === 2 ? 'current' : ''"><a></a></li>
          <li @click="step = 3" :class="step === 3 ? 'current' : ''"><a></a></li>
        </ul>
        <RightArrow @click="step = step + 1" class="right-arrow" v-show="step < 3" />
        <button class="skip-button" @click="step = 3" v-show="step < 3">{{ $t('pages.intro.skip') }}</button>
        <Button style="margin-top: 30px;" @click="createWallet" v-show="step === 3">{{ $t('pages.intro.generateWallet') }}</Button>
      </div>

      <div v-show="step === 4">
        <h2>{{ $t('pages.intro.createdWallet') }}</h2>
        <div class="text-info">
          <span class="block">{{ $t('pages.intro.step4text-1') }}</span>
          <span class="block">{{ $t('pages.intro.ever') }}</span>

          <span class="block"> {{ $t('pages.intro.step4text-2') }} </span>
        </div>

        <p class="last-msg-enjoy">{{ $t('pages.intro.enjoy-msg') }}</p>
        <Button @click="$router.push('/account')">{{ $t('pages.intro.toHome') }}</Button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { generateMnemonic, mnemonicToSeed } from '@aeternity/bip39';
import Claim from '../../../icons/claim.svg';
import Heart from '../../../icons/heart.svg';
import LeftArrow from '../../../icons/left-arrow.svg';
import RightArrow from '../../../icons/right-arrow.svg';
import Button from '../components/Button';

export default {
  components: {
    Claim,
    Heart,
    Button,
    LeftArrow,
    RightArrow,
  },
  computed: {
    ...mapGetters(['isLoggedIn']),
  },
  data() {
    return {
      step: 1,
      totalsteps: 4,
      mnemonic: null,
    };
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
      this.next();
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
  .text-info {
    margin: 10px 0 0 0;
    text-align: left;
    span:not(.aeid) {
      color: $text-color;
      font-size: 16px;
      word-break: break-word;
    }
  }
  .skip-button {
    color: $accent-color !important;
    font-size: 18px;
    margin-top: 30px;
    text-decoration: underline;
    width: 100%;
  }
  .last-msg-enjoy {
    color: $secondary-color !important;
    font-size: 18px;
    width: 100%;
    margin: 10px auto;
  }
  .left-arrow {
    left: 20px;
    position: absolute;
    cursor: pointer;
  }
  .right-arrow {
    right: 20px;
    position: absolute;
    cursor: pointer;
  }
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
