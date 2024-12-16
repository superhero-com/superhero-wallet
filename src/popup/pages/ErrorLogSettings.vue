<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="errors-log-settings">
        <p class="text-description">
          <TemplateRenderer :str="$t('pages.errors-log-settings.description', [maxLogEntries])" />
        </p>

        <div class="options">
          <SwitchButton
            :label="$t('pages.errors-log-settings.keepErrorLog')"
            :model-value="saveErrorLog"
            @click.prevent="toggleSaveErrorLog"
          />
        </div>

        <BtnMain
          :disabled="!hasErrors || !saveErrorLog"
          extend
          class="account-select-options-item"
          @click="exportErrorLog(false)"
        >
          {{ $t("pages.errors-log-settings.exportErrorLog") }}
        </BtnMain>
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { IonPage, IonContent } from '@ionic/vue';
import { MAX_LOG_ENTRIES, MODAL_CONFIRM_DISABLE_ERROR_LOG } from '@/constants';
import { useModals, useUi } from '@/composables';
import { formatNumber } from '@/utils';
import Logger from '@/lib/logger';

import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import SwitchButton from '@/popup/components/SwitchButton.vue';
import TemplateRenderer from '@/popup/components/TemplateRenderer.vue';

export default defineComponent({
  components: {
    TemplateRenderer,
    BtnMain,
    SwitchButton,
    IonPage,
    IonContent,
  },
  setup() {
    const { saveErrorLog, setSaveErrorLog } = useUi();
    const { openModal } = useModals();
    const hasErrors = ref(Logger.get().length > 0);

    async function exportErrorLog(clear: boolean = false) {
      Logger.exportErrorLog(clear);
    }

    async function toggleSaveErrorLog() {
      if (saveErrorLog.value && hasErrors.value) {
        try {
          await openModal<boolean>(MODAL_CONFIRM_DISABLE_ERROR_LOG);
          exportErrorLog(true);
          setSaveErrorLog(false);
          hasErrors.value = false;
        } catch (error) { /* NOOP */ }
      } else {
        setSaveErrorLog(!saveErrorLog.value);
      }
    }

    return {
      hasErrors,
      exportErrorLog,
      toggleSaveErrorLog,
      saveErrorLog,
      setSaveErrorLog,
      maxLogEntries: formatNumber(MAX_LOG_ENTRIES),
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.errors-log-settings {
  padding-inline: var(--screen-padding-x);

  .options {
    margin-top: 20px;
    margin-bottom: 36px;
  }
}
</style>
