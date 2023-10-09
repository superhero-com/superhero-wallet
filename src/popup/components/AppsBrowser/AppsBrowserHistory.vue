<template>
  <div
    v-if="hasHistory"
    class="apps-browser-history"
  >
    <div class="apps-browser-history-title">
      {{ $t('pages.appsBrowser.recentApps') }}
    </div>

    <div class="apps-browser-list">
      <div
        v-for="app in history"
        :key="app.cleanPath"
      >
        <AppsBrowserHistoryListItem
          :title="app.title"
          :image="app.image"
          :url="app.url"
          @click="$emit('select-app', app)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useAppsBrowserHistory } from '@/composables/appsBrowserHistory';
import AppsBrowserHistoryListItem from '@/popup/components/AppsBrowser/AppsBrowserHistoryListItem.vue';

export default defineComponent({
  name: 'AppsBrowserHistory',
  components: {
    AppsBrowserHistoryListItem,
  },
  emits: ['select-app'],
  setup() {
    const { history } = useAppsBrowserHistory();

    const hasHistory = computed(() => history.value.length > 0);

    return {
      hasHistory,
      history,
    };
  },
});
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;
@use '@/styles/typography';

.apps-browser-history {
  margin-top: 24px;
  padding: 0 16px;

  .apps-browser-history-title {
    @extend %face-sans-16-semi-bold;

    opacity: 0.5;
    color: $color-white;
    line-height: 24px;
  }

  .apps-browser-list {
    display: flex;
    flex-direction: column;
    padding-top: 8px;
    padding-bottom: 16px;
    gap: 8px;
  }
}
</style>
