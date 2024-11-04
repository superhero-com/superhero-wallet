<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="errors-log-settings">
        <p class="text-description">
          <TemplateRenderer :str="$t('pages.errors-log-settings.description')" />
        </p>

        <div class="options">
          <SwitchButton
            :label="$t('pages.errors-log-settings.keepErrorLog')"
            :model-value="saveErrorLog"
            @update:modelValue="setSaveErrorLog"
          />
        </div>

        <BtnMain
          extend
          class="account-select-options-item"
          @click.prevent="$emit('click')"
        >
          {{ $t("pages.errors-log-settings.exportErrorLog") }}
        </BtnMain>
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IonPage, IonContent } from '@ionic/vue';
import { useUi } from '@/composables';

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

    return {
      saveErrorLog,
      setSaveErrorLog,
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
