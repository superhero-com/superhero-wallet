<template>
  <PageWrapper :page-title="$t('pages.titles.saveErrorsLog')">
    <div class="errors-log-settings">
      <p class="text-description">
        {{ $t('pages.errors-log-settings.description') }}
      </p>

      <div class="options">
        <SwitchButton
          :label="$t('pages.titles.saveErrorsLog')"
          :model-value="saveErrorLog"
          @update:modelValue="setSaveErrorLog"
        />
      </div>
    </div>
  </PageWrapper>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useUi } from '@/composables';

import PageWrapper from '@/popup/components/PageWrapper.vue';
import SwitchButton from '@/popup/components/SwitchButton.vue';

export default defineComponent({
  components: {
    PageWrapper,
    SwitchButton,
  },
  setup() {
    const { saveErrorLog, setSaveErrorLog } = useUi();

    return {
      saveErrorLog,
      setSaveErrorLog,
    };
  },
});
</script>

<style lang="scss" scoped>
.errors-log-settings {
  padding-inline: var(--screen-padding-x);

  .options {
    margin-top: 20px;
  }
}
</style>
