<template>
  <BtnIcon
    class="notifications"
    data-cy="notifications-btn"
    :icon="BellIcon"
    :to="{ name: 'notifications' }"
    :badge-text="notificationsCount"
  />
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useStore } from 'vuex';
import { NOTIFICATION_STATUS_CREATED } from '../utils';
import { useNotifications } from '../../composables/notifications';
import BellIcon from '../../icons/bell.svg?vue-component';
import BtnIcon from './buttons/BtnIcon.vue';

export default defineComponent({
  name: 'NotificationsIcon',
  components: {
    BtnIcon,
  },
  setup() {
    const store = useStore();
    const { notificationsAll } = useNotifications({ store, requirePolling: true });

    const notificationsCount = computed<string | number | null>(() => {
      const count = notificationsAll.value
        .filter(({ status }) => status === NOTIFICATION_STATUS_CREATED)
        .length;

      switch (true) {
        case count === 0: return null;
        case count > 99: return '99+';
        default: return count;
      }
    });

    return {
      BellIcon,
      notificationsCount,
    };
  },
});
</script>
