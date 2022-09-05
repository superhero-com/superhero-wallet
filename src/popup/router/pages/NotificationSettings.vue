<template>
  <div class="notification-settings">
    <div class="description">
      <p>
        {{ $t('pages.notification-settings.description') }}
      </p>
      <p>
        {{ $t('pages.notification-settings.description2') }}
      </p>
    </div>
    <SwitchButton
      v-for="setting in notificationSettings"
      :key="setting.type"
      :class="{ unchecked: !setting.checked }"
      :disabled="setting.type === 'wallet'"
      :value="setting.checked"
      :label="setting.text"
      @input="toggleNotificationSetting(setting.type)"
    />
  </div>
</template>

<script>
import { mapMutations, mapState } from 'vuex';
import SwitchButton from '../components/SwitchButton.vue';

export default {
  components: { SwitchButton },
  computed: mapState(['notificationSettings']),
  methods: mapMutations(['toggleNotificationSetting']),
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.notification-settings {
  padding: 16px;

  .description {
    color: rgba(variables.$color-white, 0.75);
    padding: 6px 8px 24px 0;
    line-height: 20px;
    text-align: left;
    white-space: pre-line;

    @extend %face-sans-14-light;
  }

  .switch-button {
    margin-bottom: 12px;
  }
}
</style>
