<template>
  <div class="notification-settings">
    <div class="header">
      {{ $t('pages.notification-settings.header') }}
    </div>
    <CheckBox
      v-for="setting in notificationSettings"
      :key="setting.type"
      :class="{ unchecked: !setting.checked }"
      :disabled="setting.type === 'wallet'"
      :value="setting.checked"
      @input="toggleNotificationSetting(setting.type)"
    >
      {{ setting.text }}
    </CheckBox>
  </div>
</template>

<script>
import { mapMutations, mapState } from 'vuex';
import CheckBox from '../components/CheckBox.vue';

export default {
  components: { CheckBox },
  computed: mapState(['notificationSettings']),
  methods: mapMutations(['toggleNotificationSetting']),
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

.notification-settings {
  padding: 0;
  font-size: 0.95rem;

  .header,
  .checkbox-container {
    text-align: left;
    align-items: center;
    padding: 1.5rem 0.7rem;
    border-bottom: 2px solid variables.$color-border;

    &.unchecked {
      color: variables.$color-white;
    }
  }

  .header {
    padding: 0.75rem;
    color: variables.$color-light-grey;
    font-size: 1.05rem;
  }
}
</style>
