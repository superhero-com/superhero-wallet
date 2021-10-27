<template>
  <div :class="['intro', { iframe }]">
    <div v-show="step === 1">
      <img
        v-if="iframe"
        src="../../../icons/iframe/receive.svg"
      >
      <h2 v-else>
        <Claim /> {{ $t('pages.intro.receive') }}
        <span class="ae"> {{ $t('ae') }} </span>
      </h2>
      <div class="text-info">
        {{ $t('pages.intro.step1text') }}
      </div>
    </div>

    <div v-show="step === 2">
      <img
        v-if="iframe"
        src="../../../icons/iframe/send.svg"
      >
      <h2 v-else>
        <Heart /> {{ $t('pages.send.send') }}
        <span class="ae">{{ $t('ae') }}</span>
      </h2>
      <div class="text-info">
        {{ $t('pages.intro.step2text') }}
      </div>
    </div>

    <div v-show="step === 3">
      <img
        v-if="iframe"
        src="../../../icons/iframe/power.svg"
      >
      <div class="text-info">
        {{ $t('pages.intro.step3text-1') }}
        <span class="ae">{{ $t('ae') }}</span>
        {{ $t('pages.intro.step3text-2') }}
      </div>
      <div class="ever">
        {{ $t('pages.intro.ever') }}
      </div>
    </div>

    <div
      v-show="step < 4"
      class="dotstyle dotstyle-fillup"
      data-cy="onboarding-steps"
    >
      <Arrow
        v-show="step > 1"
        class="left arrow"
        data-cy="prev"
        @click="step = step - 1"
      />
      <ul>
        <li
          v-for="i in 3"
          :key="i"
          :class="step === i ? 'current' : ''"
          @click="step = i"
        >
          <a />
        </li>
      </ul>
      <Arrow
        v-show="step < 3"
        class="right arrow"
        data-cy="next"
        @click="step = step + 1"
      />
      <ButtonPlain
        v-show="step < 3"
        class="skip-button"
        data-cy="skip"
        @click="step = 3"
      >
        {{ $t('pages.intro.skip') }}
      </ButtonPlain>
      <Button
        v-if="step === 3"
        data-cy="generate-wallet"
        class="generate-wallet"
        @click="createWallet"
      >
        {{ $t('pages.intro.generateWallet') }}
      </Button>
    </div>

    <div v-show="step === 4">
      <template v-if="!iframe">
        <h2>{{ $t('pages.intro.createdWallet') }}</h2>
        <h4>{{ $t('pages.intro.step4text-0') }}</h4>
        <div class="text-info splitted-text">
          <span>{{ $t('pages.intro.step4text-1') }}</span>
          <span>{{ $t('pages.intro.step4text-2') }}</span>
          <span>{{ $t('pages.intro.step4text-3') }}</span>
        </div>

        <p class="last-msg-enjoy">
          {{ $t('pages.intro.step4text-4') }}
        </p>
      </template>
      <template v-else>
        <h2 class="secondary">
          {{ $t('pages.intro.welcome') }}
        </h2>
        <h4>{{ $t('pages.intro.createdWallet') }}</h4>
        <CheckBox
          v-model="understood"
          data-cy="checkbox"
        >
          <div class="undestand">
            {{ $t('pages.intro.understand') }}
          </div>
        </CheckBox>
      </template>
      <Button
        :disabled="iframe && !understood"
        data-cy="proceed-to-wallet"
        :class="!iframe && 'proceed-to-wallet'"
        @click="$router.push($store.state.loginTargetLocation)"
      >
        {{ $t('pages.intro.toHome') }}
      </Button>
      <Platforms v-if="iframe">
        {{ $t('pages.intro.step4text-iframe-1') }}
        <br>
        {{ $t('pages.intro.step4text-iframe-2') }}
      </Platforms>
    </div>
  </div>
</template>

<script>
import { generateMnemonic } from '@aeternity/bip39';
import { IN_FRAME } from '../../utils/helper';
import Claim from '../../../icons/claim.svg?vue-component';
import Heart from '../../../icons/heart.svg?vue-component';
import Arrow from '../../../icons/arrow.svg?vue-component';
import Button from '../components/Button.vue';
import ButtonPlain from '../components/ButtonPlain.vue';
import CheckBox from '../components/CheckBox.vue';
import Platforms from '../components/Platforms.vue';

export default {
  components: {
    Claim,
    Heart,
    Button,
    ButtonPlain,
    Arrow,
    CheckBox,
    Platforms,
  },
  data() {
    return {
      step: 1,
      totalsteps: 4,
      understood: !IN_FRAME,
      iframe: IN_FRAME,
    };
  },
  methods: {
    async createWallet() {
      this.$store.commit('setMnemonic', generateMnemonic());
      this.next();
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
@use '../../../styles/variables';
@use '../../../styles/mixins';

.intro {
  padding: 40px 16px 4px 16px;

  @include mixins.mobile {
    padding-top: 48px;
    padding-top: calc(env(safe-area-inset-top) + 48px);
  }

  position: relative;
  height: 80vh;

  &.iframe {
    padding-bottom: 0;

    .text-info {
      margin: 0;
    }

    .dotstyle {
      top: 78%;
    }

    h2,
    h4 {
      margin: 8px 0;
    }
  }

  .ae {
    color: variables.$color-blue;
  }

  h2 {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;

    &.secondary {
      color: variables.$color-blue;
      font-size: 22px;
    }

    svg {
      margin-right: 10px;
    }

    .ae {
      margin-left: 10px;
    }
  }

  .ever {
    margin-top: 14px;
    margin-bottom: 10px;
  }

  .text-info {
    margin: 10px 0 0 0;

    &.splitted-text span {
      margin-bottom: 4px;
      display: block;
    }
  }

  .undestand {
    text-align: left;
    color: variables.$color-white;
    font-size: 12px;
    word-break: break-word;
  }

  .skip-button {
    color: variables.$color-green;
    font-size: 18px;
    margin-top: 30px;
    text-decoration: underline;
    width: 100%;
  }

  .last-msg-enjoy {
    color: variables.$color-blue;
    font-size: 18px;
    width: 100%;
    margin: 10px auto;
  }

  .proceed-to-wallet {
    margin-top: 32px;
  }

  .arrow {
    color: #f1f1f1;
    height: 24px;
    width: 24px;
    position: absolute;
    cursor: pointer;

    &.left {
      transform: rotate(90deg);
      left: 20px;
    }

    &.right {
      transform: rotate(-90deg);
      right: 20px;
    }
  }

  .dotstyle {
    position: sticky;
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
  .dotstyle-fillup {
    .generate-wallet {
      margin-top: 30px;
    }

    li a {
      overflow: hidden;
      background-color: variables.$color-white;
      transition: background 0.3s;
    }
  }

  .dotstyle-fillup li a::after {
    content: '';
    position: absolute;
    bottom: 0;
    height: 0;
    left: 0;
    width: 100%;
    box-shadow: 0 0 1px variables.$color-light-grey;
    transition: height 0.3s;
  }

  .dotstyle-fillup li a:hover,
  .dotstyle-fillup li a:focus {
    background-color: rgba(variables.$color-black, 0.2);
  }

  .dotstyle-fillup li.current a {
    background-color: variables.$color-blue;
  }

  .dotstyle-fillup li.current a::after {
    height: 100%;
  }

  .checkbox-container {
    margin: 20px auto 50px auto;
    max-width: 270px;
  }

  .platforms {
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100%;

    .text:hover {
      margin-bottom: 20px;
    }
  }
}
</style>
