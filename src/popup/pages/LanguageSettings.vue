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
            class="language"
            :class="{ active: activeLanguage === code }"
            @input="switchLanguage(code)"
          >
            {{ name }}
            <span class="language-code">({{ code }})</span>
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
@use '@/styles/variables' as *;
@use '@/styles/typography';

.language-settings {
  padding-inline: var(--screen-padding-x);

  .text-description {
    margin-bottom: 16px;
  }

  .language {
    padding: 6px 0;

    .language-code {
      text-transform: uppercase;
    }
  }
}
</style>
