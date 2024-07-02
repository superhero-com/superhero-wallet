<template>
  <BtnIcon
    class="notifications"
    data-cy="notifications-btn"
    :icon="BellIcon"
    :to="{ name: ROUTE_NOTIFICATIONS }"
    :badge-text="notificationsCount"
    dimmed
  />
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useNotifications } from '@/composables/notifications';
import { ROUTE_NOTIFICATIONS } from '@/popup/router/routeNames';

import BtnIcon from './buttons/BtnIcon.vue';
import BellIcon from '../../icons/bell.svg?vue-component';

export default defineComponent({
  name: 'NotificationsIcon',
  components: {
    BtnIcon,
  },
  setup() {
    const { notificationsNew } = useNotifications({ requirePolling: true });

    const notificationsCount = computed<string | null>(() => {
      const count = notificationsNew.value.length;

      switch (true) {
        case count === 0: return null;
        case count > 99: return '99+';
        default: return count.toString();
      }
    });

    return {
      ROUTE_NOTIFICATIONS,
      BellIcon,
      notificationsCount,
    };
  },
});
</script>
