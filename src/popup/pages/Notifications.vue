<template>
  <div class="notifications">
    <Filters
      v-model="displayMode"
      class="filters"
      :filters="filtersConfig"
    />

    <InfiniteScroll
      v-if="notificationsToShow.length"
      :is-more-data="canLoadMore"
      @loadMore="loadMoreNotifications"
    >
      <NotificationItem
        v-for="notification in notificationsToShow"
        :key="notification.id"
        :notification="notification"
      />
    </InfiniteScroll>
    <p
      v-else
      class="empty-list-message"
    >
      {{ $t('pages.notifications.noNotifications') }}
    </p>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  onBeforeUnmount,
  onMounted,
  nextTick,
} from 'vue';
import { useStore } from 'vuex';
import NotificationItem from '../components/NotificationItem.vue';
import InfiniteScroll from '../components/InfiniteScroll.vue';
import { useNotifications } from '../../composables/notifications';
import { IS_EXTENSION } from '../../lib/environment';

import NotificationItem from '../components/NotificationItem.vue';
import InfiniteScroll from '../components/InfiniteScroll.vue';
import Filters from '../components/Filters.vue';

export default defineComponent({
  name: 'Notifications',
  components: {
    InfiniteScroll,
    NotificationItem,
    Filters,
  },
  setup() {
    const store = useStore();

    const {
      notificationsToShow,
      canLoadMore,
      loadMoreNotifications,
      markAsReadAll,
    } = useNotifications({ store, requirePolling: true });

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
      displayMode,
      filtersConfig,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.notifications {
  position: relative;
  padding: 0;

  .empty-list-message {
    @extend %face-sans-15-regular;

    max-width: 180px;
    margin-top: 56px;
    margin-inline: auto;
    text-align: center;
    opacity: 0.75;
  }

  .filters {
    margin: 0;
  }
}
</style>
