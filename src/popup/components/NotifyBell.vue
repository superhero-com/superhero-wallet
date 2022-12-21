<template>
  <BtnIcon
    class="notifications"
    data-cy="noti"
    :to="{ name: 'notifications' }"
  >
    <BellIcon class="bell-icon" />
    <span
      v-if="notificationsCount"
      class="badge"
      data-cy="noti-count"
    >
      {{ notificationsCount }}
    </span>
  </BtnIcon>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import { NOTIFICATION_STATUS_CREATED } from '../utils';
import { useNotifications } from '../../composables/notifications';
import BellIcon from '../../icons/bell.svg?vue-component';
import BtnIcon from './buttons/BtnIcon.vue';

export default defineComponent({
  name: 'NotifyBell',
  components: {
    BtnIcon,
    BellIcon,
  },
  setup() {
    const { notificationsAll } = useNotifications({ requirePolling: true });

    const notificationsCount = computed<string | number>(() => {
      const count = notificationsAll.value
        .filter(({ status }) => status === NOTIFICATION_STATUS_CREATED)
        .length;

      return count > 99 ? '99+' : count;
    });

    return {
      notificationsCount,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.notifications {
  position: relative;

  .badge {
    @extend %face-sans-11-regular;

    color: variables.$color-white;
    position: absolute;
    left: 50%;
    top: 4px;
    min-width: 14px;
    height: 14px;
    background: variables.$color-secondary;
    border-radius: 7px;
    text-align: center;
    line-height: 14px;
    padding: 0 3px;
  }

  .bell-icon {
    width: 24px;
    height: 24px;
  }
}
</style>
