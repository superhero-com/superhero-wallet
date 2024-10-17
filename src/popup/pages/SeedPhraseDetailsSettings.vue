<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="seed-phrase-details">
        <div class="text-heading-3">
          {{ $t('pages.seed-phrase-settings.this-your-seed-phrase') }}
        </div>

        <CardMnemonic class="mnemonics">
          <p class="mnemonics-text">
            {{ mnemonicDecrypted }}
          </p>
          <BtnMain
            variant="dark"
            class="copy-btn"
            big-icon
            :icon="copied ? CheckSuccessCircle : CopyOutlined"
            @click="copy(mnemonicDecrypted)"
          >
            <template v-if="!copied">
              {{ $t('pages.seed-phrase-settings.copy') }}
            </template>

            <template v-else>
              {{ $t('common.addressCopied') }}
            </template>
          </BtnMain>
        </CardMnemonic>

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
            :to="{ name: ROUTE_SEED_PHRASE_VERIFY }"
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
  useAuth,
  useCopy,
  useNotifications,
  useUi,
} from '@/composables';
import { ROUTE_ACCOUNT, ROUTE_SEED_PHRASE_VERIFY } from '@/popup/router/routeNames';

import BtnMain from '../components/buttons/BtnMain.vue';
import CardMnemonic from '../components/CardMnemonic.vue';
import CopyOutlined from '../../icons/copy-outlined.svg?vue-component';
import CheckSuccessCircle from '../../icons/check-success-circle.svg?vue-component';

export default defineComponent({
  name: 'SeedPhraseDetailsSettings',
  components: {
    BtnMain,
    IonPage,
    IonContent,
    CardMnemonic,
  },
  setup() {
    const router = useRouter();

    const { setBackedUpSeed } = useUi();
    const { copy, copied } = useCopy();
    const { mnemonicDecrypted } = useAuth();
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
      copied,
      mnemonicDecrypted,
      copy,
      markSeedPhraseAsBackedUp,
      ROUTE_SEED_PHRASE_VERIFY,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.seed-phrase-details {
  padding-inline: var(--screen-padding-x);

  .mnemonics {
    margin-bottom: 18px;

    .mnemonics-text {
      @extend %face-sans-18-regular;

      letter-spacing: 0.1em;
      line-height: 32px;
      color: $color-white;
      text-align: left;
      margin-bottom: 12px;
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
