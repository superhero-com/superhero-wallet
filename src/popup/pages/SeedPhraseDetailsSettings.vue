<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="seed-phrase-details">
        <div class="text-heading-1">
          {{ $t('pages.seed-phrase-settings.this-your-seed-phrase') }}
        </div>

        <div class="mnemonics">
          <p class="mnemonics-text">
            {{ mnemonic }}
          </p>
          <BtnMain
            variant="dark"
            class="copy-btn"
            big-icon
            :icon="copied ? CheckSuccessCircle : CopyOutlined"
            @click="copy(mnemonic)"
          >
            <template v-if="!copied">
              {{ $t('pages.seed-phrase-settings.copy') }}
            </template>

            <template v-else>
              {{ $t('common.addressCopied') }}
            </template>
          </BtnMain>
        </div>

        <i18n-t
          keypath="pages.seedPhrase.backUpYourSeedPhrase"
          tag="p"
          class="text-description"
          scope="global"
        >
          <strong>{{ $t('pages.seedPhrase.inCorrectOrder') }}</strong>
        </i18n-t>
        <i18n-t
          keypath="pages.seedPhrase.toBeSureYouGotItRight"
          tag="p"
          class="text-description"
          scope="global"
        >
          <strong>{{ $t('pages.seedPhrase.verifyYourSeedPhrase') }}</strong>
        </i18n-t>

        <div class="buttons">
          <BtnMain
            class="button"
            extend
            :text="$t('pages.seedPhrase.verifySeed')"
            :to="{ name: 'settings-seed-phrase-verify' }"
          />
          <BtnMain
            variant="muted"
            extend
            :text="$t('pages.seedPhrase.doneThis')"
            @click="markSeedPhraseAsBackedUp()"
          />
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent } from '@ionic/vue';
import {
  useAccounts,
  useCopy,
  useNotifications,
  useUi,
} from '@/composables';
import { ROUTE_ACCOUNT } from '@/popup/router/routeNames';

import BtnMain from '../components/buttons/BtnMain.vue';
import CopyOutlined from '../../icons/copy-outlined.svg?vue-component';
import CheckSuccessCircle from '../../icons/check-success-circle.svg?vue-component';

export default defineComponent({
  name: 'SeedPhraseDetailsSettings',
  components: {
    BtnMain,
    IonPage,
    IonContent,
  },
  setup() {
    const router = useRouter();

    const { setBackedUpSeed } = useUi();
    const { copy, copied } = useCopy();
    const { mnemonic } = useAccounts();
    const { removeIsSeedBackedUpNotification } = useNotifications({
      requirePolling: false,
    });

    function markSeedPhraseAsBackedUp() {
      setBackedUpSeed(true);
      removeIsSeedBackedUpNotification();
      router.push({ name: ROUTE_ACCOUNT });
    }

    return {
      CopyOutlined,
      CheckSuccessCircle,
      copy,
      copied,
      mnemonic,
      markSeedPhraseAsBackedUp,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.seed-phrase-details {
  padding-inline: var(--screen-padding-x);

  .mnemonics {
    background: rgba(variables.$color-white, 0.15);
    border: 2px solid rgba(variables.$color-white, 0.1);
    border-radius: variables.$border-radius-modal;
    margin: 0 0 20px 0;
    padding: 12px;
    text-align: center;
    box-shadow: 0 4px 8px 2px rgb(60 60 60 / 10%);
    box-sizing: border-box;

    :deep(.content) {
      padding: 12px;
    }

    .mnemonics-text {
      letter-spacing: 0.1em;
      line-height: 32px;
      color: variables.$color-white;
      text-align: left;
      margin-bottom: 12px;

      @extend %face-sans-18-regular;
    }

    .copy-btn {
      margin: 0 auto;
      min-width: 210px;
    }
  }

  .buttons {
    display: flex;
    flex-direction: column;
    gap: var(--gap);
    margin-top: 20px;
  }
}
</style>
