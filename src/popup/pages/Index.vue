<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div
        class="index"
        :class="{
          'extended-top-padding': !IS_WEB && !IS_MOBILE_DEVICE,
          'ios-top-padding': IS_IOS,
        }"
      >
        <img
          v-if="IN_FRAME"
          class="iframe-image"
          src="../../icons/iframe/sendAndReceive.svg"
        >
        <div
          v-else
          class="not-iframe"
        >
          <SuperheroLogoIcon class="superhero-logo" />
          <div class="heading">
            <i18n-t
              keypath="pages.index.heading.message"
              tag="span"
              class="tag"
              scope="global"
            >
              <span class="receive">{{ $t('pages.index.heading.receive') }}</span>
              <span class="store">{{ $t('pages.index.heading.store') }}</span>
              <span class="send">{{ $t('pages.index.heading.send') }}</span>
              <span class="aeternity-name">
                {{ $t('pages.index.heading.aeternityBlockchain') }}
              </span>
            </i18n-t>
          </div>

          <Platforms v-if="IS_WEB">
            <template #header>
              {{ $t('pages.index.platforms.heading') }}
            </template>
            <template #footer>
              {{ $t('pages.index.webVersion') }}
            </template>
          </Platforms>
        </div>

        <div :class="['terms-agreement', { mobile: !IS_WEB }]">
          <CheckBox
            v-model="termsAgreed"
            data-cy="checkbox"
          >
            <span>
              {{ $t('pages.index.term1') }}
            </span>
          </CheckBox>
          <RouterLink
            :to="{ name: 'about-terms' }"
            data-cy="terms"
            class="terms-of-use"
            :class="{ agreed: termsAgreed }"
          >
            {{ $t('pages.index.termsAndConditions') }}
          </RouterLink>
        </div>

        <transition name="fade-transition">
          <div
            v-if="termsAgreed"
            class="wallet-button-box"
          >
            <BtnSubheader
              data-cy="generate-wallet"
              :subheader="$t('pages.index.getStartedWithWallet')"
              :header="$t('pages.index.generateWallet')"
              :icon="PlusCircleIcon"
              @click="createWallet"
            />
            <BtnSubheader
              data-cy="import-wallet"
              :subheader="$t('pages.index.enterSeed')"
              :header="$t('pages.index.importWallet')"
              :icon="CheckCircleIcon"
              @click="importWallet"
            />
          </div>
        </transition>
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { generateMnemonic } from '@aeternity/bip39';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { IonPage, IonContent } from '@ionic/vue';
import {
  IN_FRAME,
  IS_MOBILE_DEVICE,
  IS_WEB,
  IS_IOS,
  MODAL_ACCOUNT_IMPORT,
} from '@/constants';
import {
  useModals,
  useUi,
} from '@/composables';

import CheckBox from '../components/CheckBox.vue';
import BtnSubheader from '../components/buttons/BtnSubheader.vue';
import Platforms from '../components/Platforms.vue';
import SuperheroLogoIcon from '../../icons/logo.svg?vue-component';
import PlusCircleIcon from '../../icons/plus-circle-fill.svg?vue-component';
import CheckCircleIcon from '../../icons/check-circle-fill.svg?vue-component';

export default defineComponent({
  components: {
    SuperheroLogoIcon,
    CheckBox,
    BtnSubheader,
    Platforms,
    IonContent,
    IonPage,
  },
  setup() {
    const store = useStore();
    const router = useRouter();
    const { openModal } = useModals();
    const { loginTargetLocation } = useUi();

    const termsAgreed = ref(false);

    async function createWallet() {
      store.commit('setMnemonic', generateMnemonic());
      router.push(loginTargetLocation.value);
    }

    async function importWallet() {
      return openModal(MODAL_ACCOUNT_IMPORT);
    }

    return {
      PlusCircleIcon,
      CheckCircleIcon,
      IS_WEB,
      IS_IOS,
      IS_MOBILE_DEVICE,
      IN_FRAME,
      termsAgreed,
      createWallet,
      importWallet,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.index {
  --padding-top: 44px;

  text-align: center;

  &.extended-top-padding {
    --padding-top: 64px;
  }

  &.ios-top-padding {
    padding-top: env(safe-area-inset-top);
  }

  .iframe-image,
  .superhero-logo {
    margin-top: var(--padding-top);
  }

  .terms-agreement {
    @include mixins.flex(center, center);

    margin-bottom: 16px;

    .terms-of-use {
      @extend %face-sans-15-regular;

      color: rgba(variables.$color-white, 0.75);
      text-decoration: none;
      margin-left: 4px;

      &:hover {
        color: variables.$color-white;
        text-decoration: underline;
      }

      &.agreed {
        color: white;
      }
    }

    &.mobile {
      margin-top: 32px;
    }
  }

  .not-iframe {
    text-align: center;

    .superhero-logo {
      height: 32px;
      margin-bottom: 8px;
    }

    .heading {
      @extend %face-sans-18-medium;

      @include mixins.flex(center);

      line-height: 125%;
      color: variables.$color-white;
      margin: 4px 60px 24px;

      .tag {
        color: rgba(variables.$color-white, 0.75);

        .receive,
        .store,
        .send {
          color: variables.$color-white;
        }

        .aeternity-name {
          color: variables.$color-secondary;
        }
      }
    }

    &.mobile {
      @extend %face-sans-20-regular;

      color: variables.$color-white;
      max-width: 80%;
      margin: 0 auto;
      min-height: 25vh;
      padding-top: 30px;
    }

    &.go {
      @extend %face-sans-20-bold;

      margin-top: -36px;
      margin-bottom: 42px;
    }

    .spinner {
      width: 256px;
      height: 256px;
      color: variables.$color-primary;
    }

    .platforms {
      margin: 0 auto;
      max-width: 312px;
    }
  }

  .wallet-button-box {
    margin-inline: 16px;
    padding-block: 4px;
  }
}
</style>
