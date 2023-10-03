<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="notifications">
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
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import {
  defineComponent,
  onBeforeUnmount,
  onMounted,
  nextTick,
} from 'vue';
import { useStore } from 'vuex';
import { IS_EXTENSION } from '@/constants';

import NotificationItem from '../components/NotificationItem.vue';
import InfiniteScroll from '../components/InfiniteScroll.vue';
import { useNotifications } from '../../composables/notifications';

export default defineComponent({
  name: 'Notifications',
  components: {
    InfiniteScroll,
    NotificationItem,
    IonPage,
    IonContent,
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
}
</style>
