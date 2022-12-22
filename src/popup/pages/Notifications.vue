<template>
  <div class="notifications">
    <InfiniteScroll
      :is-more-data="canLoadMore"
      @loadMore="loadMoreNotifications"
    >
      <NotificationItem
        v-for="notification in notificationsToShow"
        :key="notification.id"
        :notification="notification"
      />
    </InfiniteScroll>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  onBeforeUnmount,
  onMounted,
  nextTick,
} from '@vue/composition-api';
import NotificationItem from '../components/NotificationItem.vue';
import InfiniteScroll from '../components/InfiniteScroll.vue';
import { useNotifications } from '../../composables/notifications';
import { IS_EXTENSION } from '../../lib/environment';

export default defineComponent({
  name: 'Notifications',
  components: {
    InfiniteScroll,
    NotificationItem,
  },
  setup() {
    const {
      notificationsToShow,
      canLoadMore,
      loadMoreNotifications,
      markAsReadAll,
    } = useNotifications({ requirePolling: true });

    onMounted(async () => {
      loadMoreNotifications();
      if (IS_EXTENSION) {
        await nextTick();
        markAsReadAll();
      }
    });

    onBeforeUnmount(() => {
      if (!IS_EXTENSION) {
        markAsReadAll();
      }
    });

    return {
      notificationsToShow,
      canLoadMore,
      loadMoreNotifications,
      markAsReadAll,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';

.notifications {
  position: relative;
  padding: 0;
}
</style>
