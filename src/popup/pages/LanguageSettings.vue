<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="language-settings">
        <p class="text-description">
          {{ $t('pages.languageSettings.chooseLanguage') }}
        </p>

        <div class="languages">
          <RadioButton
            v-for="{ code, name } in languageList"
            :key="code"
            :value="activeLanguage === code"
            :disabled="false"
            :class="['language', {active: activeLanguage === code }]"
            @input="switchLanguage(code)"
          >
            <div
              class="row"
              @click="switchLanguage(code)"
            >
              <div>
                {{ name }}
                <span>({{ code }})</span>
              </div>
            </div>
          </RadioButton>
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IonPage, IonContent } from '@ionic/vue';
import { languages } from '@/popup/plugins/i18n';
import { useLanguages } from '@/composables';

import RadioButton from '../components/RadioButton.vue';

const languageList = Object.entries(languages)
  .map(([code, { name }]) => ({ code, name }))
  .sort();

export default defineComponent({
  components: { RadioButton, IonPage, IonContent },
  setup() {
    const { activeLanguage, switchLanguage } = useLanguages();

    return {
      languageList,
      activeLanguage,
      switchLanguage,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.language-settings {
  padding-inline: var(--screen-padding-x);

  .text-description {
    margin-bottom: 16px;
  }

  .language {
    @extend %face-sans-14-medium;

    padding: 6px 0;
    opacity: 0.5;

    &.active {
      opacity: 1;
    }

    .language-code {
      text-transform: uppercase;
    }

    .row {
      width: 100%;
      display: inline-flex;
      justify-content: flex-start;
      align-items: center;
      gap: 4px;
    }
  }
}
</style>
