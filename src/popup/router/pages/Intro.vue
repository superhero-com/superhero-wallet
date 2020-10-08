<template>
  <div :class="['popup', { iframe }]">
    <div class="createWallet-holder">
      <div v-show="step === 1">
        <img v-if="iframe" src="../../../icons/iframe/receive.svg" />
        <h2 v-else>
          <Claim /> {{ $t('pages.intro.receive') }}
          <span class="ml-10 secondary-text"> {{ $t('pages.appVUE.aeid') }} </span>
        </h2>
        <div class="text-info">
          <span>
            {{ $t('pages.intro.step1text') }}
          </span>
        </div>
      </div>

      <div v-show="step === 2">
        <img v-if="iframe" src="../../../icons/iframe/send.svg" />
        <h2 v-else>
          <Heart /> {{ $t('pages.send.send') }}
          <span class="ml-10 secondary-text">{{ $t('pages.appVUE.aeid') }}</span>
        </h2>
        <div class="text-info">
          <span>
            {{ $t('pages.intro.step2text') }}
          </span>
        </div>
      </div>

      <div v-show="step === 3">
        <img v-if="iframe" src="../../../icons/iframe/power.svg" />
        <div class="text-info">
          <span>
            {{ $t('pages.intro.step3text-1') }}
            <span class="secondary-text aeid">{{ $t('pages.appVUE.aeid') }}</span>
            {{ $t('pages.intro.step3text-2') }}
            <span class="white" v-if="iframe">
              <br />
              {{ $t('pages.intro.ever') }}
            </span>
          </span>
        </div>
        <div v-if="!iframe" class="mt-32 text-left">
          {{ $t('pages.intro.ever') }}
        </div>
      </div>

      <div class="dotstyle dotstyle-fillup" v-show="step < 4" data-cy="onboarding-steps">
        <LeftArrow @click="step = step - 1" class="left-arrow" v-show="step > 1" data-cy="prev" />
        <ul>
          <li @click="step = 1" :class="step === 1 ? 'current' : ''"><a></a></li>
          <li @click="step = 2" :class="step === 2 ? 'current' : ''"><a></a></li>
          <li @click="step = 3" :class="step === 3 ? 'current' : ''"><a></a></li>
        </ul>
        <RightArrow @click="step = step + 1" class="right-arrow" v-show="step < 3" data-cy="next" />
        <button class="skip-button" @click="step = 3" v-show="step < 3" data-cy="skip">
          {{ $t('pages.intro.skip') }}
        </button>
        <Button
          style="margin-top: 30px;"
          @click="createWallet"
          v-if="step === 3"
          data-cy="generate-wallet"
          >{{ $t('pages.intro.generateWallet') }}</Button
        >
      </div>

      <div v-show="step === 4">
        <template v-if="!iframe">
          <h2>{{ $t('pages.intro.createdWallet') }}</h2>
          <h4>{{ $t('pages.intro.step4text-0') }}</h4>
          <div class="text-info">
            <span class="mb-4 block">{{ $t('pages.intro.step4text-1') }}</span>
            <span class="mb-4 block"> {{ $t('pages.intro.step4text-2') }} </span>
            <span class="mb-4 block"> {{ $t('pages.intro.step4text-3') }} </span>
          </div>

          <p class="last-msg-enjoy">{{ $t('pages.intro.step4text-4') }}</p>
        </template>
        <template v-else>
          <h2 class="secondary">{{ $t('pages.intro.wellcome') }}</h2>
          <h4>{{ $t('pages.intro.createdWallet') }}</h4>
          <CheckBox v-model="understood" data-cy="checkbox">
            <div class="undestand">
              {{ $t('pages.intro.understand') }}
            </div>
          </CheckBox>
        </template>
        <Button
          :disabled="iframe && !understood"
          @click="$router.push($store.state.loginTargetLocation)"
          data-cy="proceed-to-wallet"
        >
          {{ $t('pages.intro.toHome') }}
        </Button>
        <div v-if="iframe" class="footer">
          <div>
            {{ $t('pages.intro.step4text-iframe-1') }}
            <br />
            {{ $t('pages.intro.step4text-iframe-2') }}
          </div>
          <div class="div-icons">
            <div class="extension">
              {{ $t('pages.intro.extension') }}
              <div>
                <a
                  @click="
                    openUrl(
                      'https://addons.mozilla.org/en-US/firefox/addon/superhero-wallet/',
                      true,
                    )
                  "
                >
                  <img
                    :class="{ disabled: !isFirefox() }"
                    src="../../../icons/platforms/firefox.svg"
                  />
                </a>
                <a
                  @click="
                    openUrl(
                      'https://chrome.google.com/webstore/detail/superhero/mnhmmkepfddpifjkamaligfeemcbhdne',
                      true,
                    )
                  "
                >
                  <img
                    :class="{ disabled: isFirefox() }"
                    src="../../../icons/platforms/chrome.svg"
                  />
                </a>
              </div>
            </div>
            <div class="mobile-app">
              {{ $t('pages.intro.mobileApp') }}
              <div>
                <a @click="openUrl('https://testflight.apple.com/join/3o5r4dQQ', true)">
                  <img src="../../../icons/platforms/app-store.svg" />
                </a>
                <a
                  @click="
                    openUrl(
                      'https://play.google.com/store/apps/details?id=com.superhero.cordova',
                      true,
                    )
                  "
                >
                  <img src="../../../icons/platforms/google-play.svg" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { detect } from 'detect-browser';
import { generateMnemonic, mnemonicToSeed } from '@aeternity/bip39';
import { IN_FRAME } from '../../utils/helper';
import openUrl from '../../utils/openUrl';
import Claim from '../../../icons/claim.svg?vue-component';
import Heart from '../../../icons/heart.svg?vue-component';
import LeftArrow from '../../../icons/left-arrow.svg?vue-component';
import RightArrow from '../../../icons/right-arrow.svg?vue-component';
import Button from '../components/Button';
import CheckBox from '../components/CheckBox';

export default {
  components: {
    Claim,
    Heart,
    Button,
    LeftArrow,
    RightArrow,
    CheckBox,
  },
  data() {
    return {
      step: 1,
      totalsteps: 4,
      mnemonic: null,
      understood: !IN_FRAME,
      iframe: IN_FRAME,
      openUrl,
    };
  },
  methods: {
    async createWallet() {
      this.mnemonic = generateMnemonic();
      const seed = mnemonicToSeed(this.mnemonic).toString('hex');
      const address = await this.$store.dispatch('generateWallet', { seed });
      this.$store.commit('setMnemonic', this.mnemonic);
      const keypair = {
        publicKey: address,
        privateKey: seed,
      };
      await this.$store.dispatch('setLogin', { keypair });
      this.next();
    },
    isFirefox() {
      return detect().name === 'firefox';
    },
    prev() {
      this.step -= 1;
    },
    next() {
      if (this.step <= this.totalsteps) {
        this.step += 1;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';

.popup.iframe {
  padding-top: 0;
  padding-bottom: 0;

  .createWallet-holder {
    padding-top: 0;

    .text-info {
      margin: 0;
    }
  }

  .dotstyle {
    top: 78%;
  }

  h2,
  h4 {
    margin: 8px 0;
  }
}

.createWallet-holder {
  position: relative;
  height: 80vh;
  padding-top: 40px;

  h2 {
    display: flex;
    justify-content: center;
    font-size: 18px;

    &.secondary {
      color: $secondary-color;
      font-size: 22px;
    }

    svg {
      margin-right: 10px;
    }
  }

  .text-info {
    margin: 10px 0 0 0;
    text-align: center;

    span:not(.aeid) {
      color: $text-color;
      font-size: 16px;
      word-break: break-word;
    }

    span.white {
      color: #fff;
    }
  }

  .undestand {
    text-align: left;
    color: $text-color;
    font-size: 12px;
    word-break: break-word;
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

.dotstyle button {
  display: block;
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

.checkbox-container {
  margin: 20px auto 50px auto;
  max-width: 270px;

  ::v-deep .checkmark {
    width: 50px;
  }
}

.footer {
  background-color: #21222c;
  margin: 20px -20px 0 -25px;
  padding: 0 10px;
  word-break: break-word;

  div {
    padding: 10px;
  }

  .div-icons {
    border-top: 2px solid $nav-bg-color;
    display: flex;
    text-align: center;
    padding-top: 0;
    padding-bottom: 0;

    img {
      height: 40px;
      width: 40px;
    }

    .extension {
      width: 50%;
      border-right: 1px solid $nav-bg-color;
    }

    .mobile-app {
      flex-grow: 1;
      border-left: 1px solid $nav-bg-color;
    }

    .mobile-app,
    .extension {
      div {
        display: flex;
        justify-content: space-around;
      }
    }
  }
}
</style>
