<template>
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
        :value="setting.checked"
        :label="setting.text"
        @input="toggleNotificationSetting(setting.type)"
      />
    </div>
  </div>
</template>

<script>
import { mapMutations, mapState } from 'vuex';
import { NOTIFICATION_TYPE_WALLET } from '../utils/constants';
import SwitchButton from '../components/SwitchButton.vue';

export default {
  components: { SwitchButton },
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
