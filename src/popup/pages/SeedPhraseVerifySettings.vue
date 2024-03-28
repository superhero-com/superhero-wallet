<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="seed-phrase-verify-settings">
        <div class="seed-phrase-verify-settings-body">
          <div
            class="text-heading-1"
            v-text="$t('pages.seed-phrase-settings.verifyYourSeedPhrase')"
          />

          <div
            class="text-description"
            v-text="$t('pages.seed-phrase-settings.confirm-that-you-save-your-seed-phrase')"
          />
          <i18n-t
            keypath="pages.seed-phrase-settings.compose-your-seed-phrase"
            tag="div"
            class="text-description"
            scope="global"
          >
            <strong>
              {{ $t('pages.seed-phrase-settings.in-correct-order') }}
            </strong>
          </i18n-t>

          <div class="source-phrases">
            <SeedPhraseBadge
              v-for="(word, index) in mnemonicShuffled"
              :key="index"
              :text="word"
              :selected="selectedWordIds.includes(index)"
              @click="onSelectWord(index)"
            />
          </div>

          <div class="selected-phrases">
            <SeedPhraseNotification
              v-if="showNotification"
              class="selected-phrases-notification"
              :has-error="hasError"
            />
            <CardMnemonic class="selected-phrases-list">
              <template v-if="!selectedWordIds.length">
                <SeedPhraseBadge
                  v-for="(word, index) in examplePhrase"
                  :key="index"
                  :text="word"
                  selected
                  editable
                />
              </template>
              <template v-else>
                <SeedPhraseBadge
                  v-for="(id, index) in selectedWordIds"
                  :key="id"
                  :text="mnemonicShuffled[id]"
                  editable
                  @click="selectedWordIds.splice(index, 1)"
                />
              </template>
            </CardMnemonic>
          </div>
        </div>

        <FixedScreenFooter>
          <BtnMain
            v-if="hasError || !showNotification"
            class="verify-button"
            :disabled="isVerifyButtonDisabled"
            :text="$t('pages.seedPhrase.verify')"
            @click="verifyLastStep"
          />
          <BtnMain
            v-else
            :text="$t('common.backToHome')"
            :to="{ name: ROUTE_ACCOUNT }"
          />
        </FixedScreenFooter>
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { shuffle } from 'lodash-es';
import { useI18n } from 'vue-i18n';
import { IonPage, IonContent, onIonViewWillLeave } from '@ionic/vue';

import { useAccounts, useNotifications, useUi } from '@/composables';
import { ROUTE_ACCOUNT } from '@/popup/router/routeNames';

import BtnMain from '../components/buttons/BtnMain.vue';
import CardMnemonic from '../components/CardMnemonic.vue';
import FixedScreenFooter from '../components/FixedScreenFooter.vue';
import SeedPhraseNotification from '../components/SeedPhraseNotification.vue';
import SeedPhraseBadge from '../components/SeedPhraseBadge.vue';

export default defineComponent({
  components: {
    SeedPhraseBadge,
    SeedPhraseNotification,
    FixedScreenFooter,
    BtnMain,
    CardMnemonic,
    IonPage,
    IonContent,
  },
  setup() {
    const { t } = useI18n();

    const { setBackedUpSeed } = useUi();
    const { mnemonic } = useAccounts();
    const { removeIsSeedBackedUpNotification } = useNotifications({ requirePolling: false });

    const selectedWordIds = ref<number[]>([]);
    const showNotification = ref(false);
    const hasError = ref(false);
    const examplePhrase = ref([t('pages.seedPhrase.first'), t('pages.seedPhrase.second'), '...']);

    const mnemonicShuffled = computed((): string[] => shuffle(mnemonic.value.split(' ')));
    const isVerifyButtonDisabled = computed(() => (
      !selectedWordIds.value.length
      || selectedWordIds.value.length !== mnemonicShuffled.value.length
      || (hasError.value && showNotification.value)
    ));

    function verifyLastStep() {
      const mnemonicSelected = selectedWordIds.value
        .map((idx) => mnemonicShuffled.value[idx])
        .join(' ');
      showNotification.value = true;
      hasError.value = mnemonic.value !== mnemonicSelected;

      if (!hasError.value) {
        setBackedUpSeed(true);
        removeIsSeedBackedUpNotification();
      } else {
        setTimeout(() => {
          showNotification.value = false;
        }, 3000);
      }
    }

    function onSelectWord(index: number) {
      if (!selectedWordIds.value.includes(index)) {
        selectedWordIds.value.push(index);
      }
    }

    onIonViewWillLeave(() => {
      selectedWordIds.value = [];
      showNotification.value = false;
      hasError.value = false;
    });

    return {
      ROUTE_ACCOUNT,
      selectedWordIds,
      showNotification,
      hasError,
      examplePhrase,
      mnemonic,
      mnemonicShuffled,
      isVerifyButtonDisabled,
      verifyLastStep,
      onSelectWord,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.seed-phrase-verify-settings {
  position: relative;

  &-body {
    padding: var(--screen-padding-x);
  }

  .title {
    @extend %face-sans-18-regular;

    color: rgba(variables.$color-white, 1);
    margin-bottom: 18px;
    text-align: center;
  }

  .source-phrases {
    margin-top: 18px;
  }

  .selected-phrases {
    position: relative;
    margin-top: 18px;

    .selected-phrases-list {
      min-height: 180px; // 4 rows of badges
    }

    .selected-phrases-notification {
      position: absolute;
      z-index: 1;
      inset: 0;
    }
  }
}
</style>
