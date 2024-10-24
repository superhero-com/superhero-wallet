<template>
  <PageWrapper :page-title="$t('pages.titles.language')">
    <div class="language-settings">
      <p
        class="text-description"
        v-text="$t('pages.languageSettings.chooseLanguage')"
      />

      <div class="languages">
        <RadioButton
          v-for="{ code, name } in languageList"
          :key="code"
          :value="activeLanguage === code"
          :class="{ active: activeLanguage === code }"
          class="language"
          has-label-effect
          @input="switchLanguage(code)"
        >
          {{ name }}
          <span class="language-code">({{ code }})</span>
        </RadioButton>
      </div>
    </div>
  </PageWrapper>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { languages, SupportedLanguage } from '@/popup/plugins/i18n';
import { useLanguages } from '@/composables';

import PageWrapper from '../components/PageWrapper.vue';
import RadioButton from '../components/RadioButton.vue';

export default defineComponent({
  components: {
    PageWrapper,
    RadioButton,
  },
  setup() {
    const { activeLanguage, switchLanguage } = useLanguages();

    const languageList = Object.entries(languages)
      .map(([code, { name }]) => ({ code, name } as { code: SupportedLanguage; name: string }))
      .sort();

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
