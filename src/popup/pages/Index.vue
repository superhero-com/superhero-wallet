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

        <div
          v-if="isRestoringAccounts"
          :class="['restoring-accounts', { mobile: !IS_WEB }]"
          data-cy="restoring-accounts"
        >
          <AnimatedSpinnerIcon class="spinner" />
          <p class="text-description">
            {{ $t('pages.index.restoringAccounts') }}<br>
            {{ $t('common.actionMayTakeFewMoments') }}
          </p>
        </div>
        <template v-else>
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
        </template>
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  ref,
  watch,
} from 'vue';
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
  MODAL_RESET_WALLET,
  PROTOCOLS,
} from '@/constants';
import { handleUnknownError } from '@/utils';
import { StoredWalletFoundError } from '@/lib/errors';
import { ROUTE_INDEX } from '@/popup/router/routeNames';
import {
  useAccounts,
  useAuth,
  useModals,
  useNotifications,
  useUi,
} from '@/composables';

import CheckBox from '@/popup/components/CheckBox.vue';
import BtnSubheader from '@/popup/components/buttons/BtnSubheader.vue';
import Platforms from '@/popup/components/Platforms.vue';

import SuperheroLogoIcon from '@/icons/logo.svg?vue-component';
import PlusCircleIcon from '@/icons/plus-circle.svg?vue-component';
import CheckCircleIcon from '@/icons/check-circle-fill.svg?vue-component';
import AnimatedSpinnerIcon from '@/icons/animated-spinner.svg?vue-component';

/** Enough for a normal discovery; a stalled node falls back to the first account. */
const ACCOUNTS_RESTORE_TIMEOUT = 30000;

export default defineComponent({
  components: {
    SuperheroLogoIcon,
    CheckBox,
    BtnSubheader,
    Platforms,
    IonContent,
    IonPage,
    AnimatedSpinnerIcon,
  },
  setup() {
    const router = useRouter();
    const { t } = useI18n();
    const {
      accountsRaw,
      isLoggedIn,
      addRawAccount,
      discoverAccounts,
      setActiveAccountByGlobalIdx,
    } = useAccounts();
    const {
      isAuthenticated,
      mnemonic,
      generateMnemonic,
      setMnemonicAndInitializeAuthentication,
    } = useAuth();
    const { openConfirmModal, openDefaultModal, openModal } = useModals();
    const { addWalletNotification } = useNotifications();
    const { loginTargetLocation } = useUi();

    const termsAgreed = ref(false);
    const isRestoringAccounts = ref(false);

    let isWalletNew = false;
    let isOpeningStoredWallet = false;

    /**
     * On mobile this page is also reachable with a locked or unreadable wallet stored.
     * Replacing it in place would keep its imported accounts, so offer the reset instead.
     * Resolves `true` when such a wallet is in the way.
     */
    async function offerResetOfLockedWallet(): Promise<boolean> {
      if (!IS_MOBILE_APP || !mnemonic.value || isAuthenticated.value) {
        return false;
      }
      await openConfirmModal({
        title: t('pages.index.replaceWalletTitle'),
        msg: t('pages.index.replaceWalletMessage'),
        icon: 'warning',
        buttonMessage: t('pages.index.replaceWalletConfirm'),
      })
        .then(() => openModal(MODAL_RESET_WALLET))
        .catch(() => { /* NOOP - dismissed */ });
      return true;
    }

    async function restoreAccounts() {
      isRestoringAccounts.value = true;
      let isComplete = false;
      try {
        isComplete = await discoverAccounts({ timeout: ACCOUNTS_RESTORE_TIMEOUT });
      } catch (error) {
        handleUnknownError(error);
      } finally {
        // Nothing found and no chain chosen, or the discovery didn't finish.
        if (!accountsRaw.value.length) {
          addRawAccount({
            isRestored: true,
            protocol: PROTOCOLS.aeternity,
            type: ACCOUNT_TYPES.hdWallet,
          });
        }
        isRestoringAccounts.value = false;
      }
      if (!isComplete) {
        addWalletNotification({
          title: t('pages.index.restoreIncompleteTitle'),
          text: t('pages.index.restoreIncompleteText'),
        });
      }
    }

    /**
     * An unlocked seed is opened, restoring its accounts when it has none (an interrupted
     * import, a reinstall, or lost app storage), so a new wallet can't be created over it.
     */
    async function openStoredWallet() {
      if (isOpeningStoredWallet) {
        return;
      }
      isOpeningStoredWallet = true;
      try {
        if (!accountsRaw.value.length) {
          await restoreAccounts();
        }
        if (!isLoggedIn.value) {
          setActiveAccountByGlobalIdx(0);
        }
        router.push(loginTargetLocation.value);
      } finally {
        isOpeningStoredWallet = false;
      }
    }

    /**
     * Ionic keeps this page mounted, so it can be shown again after the seed got unlocked
     * on another page. Resolves `true` when that seed was opened instead.
     */
    async function openUnlockedWallet(): Promise<boolean> {
      if (!mnemonic.value || !isAuthenticated.value) {
        return false;
      }
      await openStoredWallet();
      return true;
    }

    async function createWallet() {
      if (await offerResetOfLockedWallet() || await openUnlockedWallet()) {
        return;
      }
      isWalletNew = true;
      try {
        const selectedProtocol = await openModal<Protocol>(MODAL_PROTOCOL_SELECT, {
          title: t('pages.index.generateWallet'),
          subtitle: t('pages.index.selectProtocol'),
          resolve: (protocol: Protocol) => protocol,
        });
        await setMnemonicAndInitializeAuthentication(generateMnemonic()).catch((error: unknown) => {
          // Web mostly gets here on a cancelled password modal.
          if (IS_MOBILE_APP && !(error instanceof StoredWalletFoundError)) {
            openDefaultModal({ icon: 'critical', msg: t('pages.index.walletNotSaved') });
          }
          throw error;
        });
        addRawAccount({
          isRestored: false,
          protocol: selectedProtocol,
          type: ACCOUNT_TYPES.hdWallet,
        });
        router.push(loginTargetLocation.value);
      } catch (error) {
        // The user is offered to reload instead.
        if (!(error instanceof StoredWalletFoundError)) {
          throw error;
        }
      } finally {
        isWalletNew = false;
      }
    }

    async function importWallet() {
      if (await offerResetOfLockedWallet() || await openUnlockedWallet()) {
        return;
      }
      isWalletNew = true;
      try {
        await openModal(MODAL_ACCOUNT_IMPORT);
      } finally {
        isWalletNew = false;
      }
    }

    onMounted(() => {
      // At startup, or once a locked wallet is unlocked here (e.g. Face ID on resume).
      watch(
        () => !!mnemonic.value && isAuthenticated.value,
        async (isUnlocked: boolean) => {
          if (isUnlocked && !isWalletNew && router.currentRoute.value.name === ROUTE_INDEX) {
            await openStoredWallet();
          }
        },
        { immediate: true },
      );
    });

    return {
      PlusCircleIcon,
      CheckCircleIcon,
      IS_WEB,
      IS_IOS,
      IS_MOBILE_DEVICE,
      IN_FRAME,
      termsAgreed,
      isRestoringAccounts,
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

  .restoring-accounts {
    &.mobile {
      margin-top: 32px;
    }

    .spinner {
      width: 56px;
      height: 56px;
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
