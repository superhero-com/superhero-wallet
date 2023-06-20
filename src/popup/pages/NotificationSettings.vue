<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="notification-settings">
        <p class="text-description">
          {{ $t('pages.notification-settings.description') }}
        </p>
        <p class="text-description">
          {{ $t('pages.notification-settings.description2') }}
        </p>

        <div class="switches">
          <SwitchButton
            v-for="setting in notificationSettings"
            :key="setting.type"
            :class="{ unchecked: !setting.checked }"
            :disabled="setting.type === NOTIFICATION_TYPE_WALLET"
            :model-value="setting.checked"
            :label="setting.text"
            @update:modelValue="toggleNotificationSetting(setting.type)"
          />
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { IonPage, IonContent } from '@ionic/vue';
import { mapMutations, mapState } from 'vuex';
import { NOTIFICATION_TYPE_WALLET } from '@/constants';
import SwitchButton from '../components/SwitchButton.vue';

export default {
  components: {
    SwitchButton,
    IonPage,
    IonContent,
  },
  data: () => ({
    NOTIFICATION_TYPE_WALLET,
  }),
  computed: mapState(['notificationSettings']),
  methods: mapMutations(['toggleNotificationSetting']),
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.notification-settings {
  padding: var(--screen-padding-x);

  .switches {
    margin-top: 20px;

    .switch-button {
      margin-bottom: 12px;
    }
  }
}
</style>
