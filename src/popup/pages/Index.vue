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
          alt="Send & receive tips across the globe!"
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
              <span
                class="emphasis"
                v-text="$t('pages.index.heading.web3')"
              />
              <span
                class="emphasis"
                v-text="$t('pages.index.heading.deFi')"
              />
            </i18n-t>
          </div>

          <Platforms v-if="IS_WEB" />
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
import { defineComponent, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent } from '@ionic/vue';
import { useI18n } from 'vue-i18n';
import type { Protocol } from '@/types';
import {
  ACCOUNT_TYPES,
  IN_FRAME,
  IS_IOS,
  IS_MOBILE_APP,
  IS_MOBILE_DEVICE,
  IS_WEB,
  MODAL_ACCOUNT_IMPORT,
  MODAL_PROTOCOL_SELECT,
} from '@/constants';
import { watchUntilTruthy } from '@/utils';
import {
  useAccounts,
  useAuth,
  useModals,
  useUi,
} from '@/composables';

import CheckBox from '@/popup/components/CheckBox.vue';
import BtnSubheader from '@/popup/components/buttons/BtnSubheader.vue';
import Platforms from '@/popup/components/Platforms.vue';

import SuperheroLogoIcon from '@/icons/logo.svg?vue-component';
import PlusCircleIcon from '@/icons/plus-circle-fill.svg?vue-component';
import CheckCircleIcon from '@/icons/check-circle-fill.svg?vue-component';

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
    const router = useRouter();
    const { t } = useI18n();
    const {
      isLoggedIn,
      addRawAccount,
      discoverAccounts,
      setActiveAccountByGlobalIdx,
    } = useAccounts();
    const {
      mnemonic,
      generateMnemonic,
      setMnemonicAndInitializeAuthentication,
    } = useAuth();
    const { openModal } = useModals();
    const { loginTargetLocation, setLoaderVisible } = useUi();

    const termsAgreed = ref(false);

    let isWalletNew = false;

    async function createWallet() {
      isWalletNew = true;

      const selectedProtocol = await openModal<Protocol>(MODAL_PROTOCOL_SELECT, {
        title: t('pages.index.generateWallet'),
        subtitle: t('pages.index.selectProtocol'),
        resolve: (protocol: Protocol) => protocol,
      });

      await setMnemonicAndInitializeAuthentication(generateMnemonic());

      addRawAccount({
        isRestored: false,
        protocol: selectedProtocol,
        type: ACCOUNT_TYPES.hdWallet,
      });

      router.push(loginTargetLocation.value);
    }

    async function importWallet() {
      isWalletNew = true;
      await openModal(MODAL_ACCOUNT_IMPORT);
    }

    /**
     * TMP: for IOS Migration
     */
    onMounted(async () => {
      if (IS_IOS && IS_MOBILE_APP) {
        await watchUntilTruthy(mnemonic);
        if (mnemonic.value && !isWalletNew) {
          setLoaderVisible(true);
          await discoverAccounts();
          setActiveAccountByGlobalIdx(0);
          if (isLoggedIn.value) {
            router.push(loginTargetLocation.value);
          }
          setLoaderVisible(false);
        }
      }
    });

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
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

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
    @extend %face-sans-15-medium;
    @include mixins.flex(center, center);

    margin-bottom: 16px;

    .terms-of-use {
      text-decoration: none;
      margin-left: 4px;

      &:hover {
        text-decoration: underline;
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
      color: $color-white;
      margin: 4px 60px 24px;

      .tag {
        color: rgba($color-white, 0.75);

        .emphasis {
          color: $color-white;
        }

        .aeternity-name {
          color: $color-secondary;
        }
      }
    }

    &.mobile {
      @extend %face-sans-20-regular;

      color: $color-white;
      max-width: 80%;
      margin: 0 auto;
      min-height: 25vh;
      padding-top: 30px;
    }

    .spinner {
      width: 256px;
      height: 256px;
      color: $color-primary;
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
