<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
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
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IonPage, IonContent } from '@ionic/vue';
import { useUi } from '@/composables';

import SwitchButton from '../components/SwitchButton.vue';

export default defineComponent({
  components: {
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
@use '../../styles/variables';
@use '../../styles/typography';

.errors-log-settings {
  padding-inline: var(--screen-padding-x);

  .options {
    margin-top: 20px;
  }
}
</style>
