<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="errors-log-settings">
        <p class="text-description">
          {{ $t('pages.errors-log-settings.description') }}
        </p>

        <div class="options">
          <SwitchButton
            :label="$t('pages.titles.save-errors-log')"
            :model-value="saveErrorLog"
            @update:modelValue="setSaveErrorLog"
          />
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { IonPage, IonContent } from '@ionic/vue';
import { mapState, mapMutations } from 'vuex';
import SwitchButton from '../components/SwitchButton.vue';

export default {
  components: { SwitchButton, IonPage, IonContent },
  computed: mapState(['saveErrorLog']),
  methods: mapMutations(['setSaveErrorLog']),
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.errors-log-settings {
  padding: var(--screen-padding-x);

  .options {
    margin-top: 20px;
  }
}
</style>
