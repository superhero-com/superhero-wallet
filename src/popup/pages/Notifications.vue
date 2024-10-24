<template>
  <PageWrapper :page-title="$t('pages.titles.notifications')">
    <div
      ref="innerElement"
      class="notifications"
    >
      <InfiniteScroll
        v-if="notificationsToShow.length"
        @load-more="loadMoreNotifications"
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
  </PageWrapper>
</template>

<script lang="ts">
import {
  defineComponent,
  onBeforeUnmount,
  onMounted,
  nextTick,
  ref,
} from 'vue';
import { IS_EXTENSION } from '@/constants';
import { useViewport, useNotifications } from '@/composables';

import PageWrapper from '@/popup/components/PageWrapper.vue';
import NotificationItem from '@/popup/components/NotificationItem.vue';
import InfiniteScroll from '@/popup/components/InfiniteScroll.vue';

export default defineComponent({
  name: 'Notifications',
  components: {
    PageWrapper,
    InfiniteScroll,
    NotificationItem,
  },
  setup() {
    const { initViewport } = useViewport();

    const innerElement = ref<HTMLElement>();

    const {
      notificationsToShow,
      loadMoreNotifications,
      markAsReadAll,
    } = useNotifications({ requirePolling: true });

    onMounted(async () => {
      initViewport(innerElement.value?.parentElement!);
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
      innerElement,
      notificationsToShow,
      loadMoreNotifications,
      markAsReadAll,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

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
}
</style>
