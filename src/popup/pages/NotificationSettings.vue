<template>
  <PageWrapper :page-title="$t('pages.titles.notifications')">
    <div class="notification-settings">
      <p class="text-description">
        {{ $t('pages.notificationSettings.description') }}
      </p>
      <p class="text-description">
        {{ $t('pages.notificationSettings.description2') }}
      </p>

      <div class="switches">
        <SwitchButton
          v-for="(label, type) in notificationTypeLabels"
          :key="type"
          :disabled="type === NOTIFICATION_TYPES.wallet"
          :model-value="isNotificationTypeAllowed(type)"
          :label="label"
          @update:modelValue="toggleNotificationsSetting(type)"
        />
      </div>
    </div>
  </PageWrapper>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import type { NotificationType } from '@/types';
import { NOTIFICATION_TYPES } from '@/constants';
import { useNotifications } from '@/composables';

import PageWrapper from '@/popup/components/PageWrapper.vue';
import SwitchButton from '@/popup/components/SwitchButton.vue';

export default defineComponent({
  components: {
    PageWrapper,
    SwitchButton,
  },
  setup() {
    const { t } = useI18n();
    const {
      isNotificationTypeAllowed,
      toggleNotificationsSetting,
    } = useNotifications();

    const notificationTypeLabels: Record<NotificationType, string> = {
      [NOTIFICATION_TYPES.wallet]: t('pages.notificationSettings.wallet'),
      [NOTIFICATION_TYPES.commentOnTip]: t('pages.notificationSettings.commentOnTip'),
      [NOTIFICATION_TYPES.commentOnComment]: t('pages.notificationSettings.commentOnComment'),
      [NOTIFICATION_TYPES.retipOnTip]: t('pages.notificationSettings.retipOnTip'),
      [NOTIFICATION_TYPES.claimOfTip]: t('pages.notificationSettings.claimOfTip'),
      [NOTIFICATION_TYPES.claimOfRetip]: t('pages.notificationSettings.claimOfRetip'),
      [NOTIFICATION_TYPES.tipOnComment]: t('pages.notificationSettings.tipOnComment'),
    };

    return {
      NOTIFICATION_TYPES,
      notificationTypeLabels,
      isNotificationTypeAllowed,
      toggleNotificationsSetting,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.notification-settings {
  padding-inline: var(--screen-padding-x);

  .switches {
    margin-top: 20px;

    .switch-button {
      margin-bottom: 12px;
    }
  }
}
</style>
