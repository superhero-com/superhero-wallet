<template>
  <div class="infinite-scroll">
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent, watch } from 'vue';
import { useViewport } from '../../composables/viewport';

export default defineComponent({
  name: 'InfiniteScroll',
  props: {
    isMoreData: { type: Boolean, required: true },
  },
  emits: ['loadMore'],
  setup(props, { emit }) {
    const { viewportElement, onViewportScroll } = useViewport();

    watch(
      viewportElement,
      () => {
        onViewportScroll(({ isOutsideOfViewport }) => {
          if (props.isMoreData && isOutsideOfViewport) {
            emit('loadMore');
          }
        });
      },
      { immediate: true },
    );
  },
});
</script>

<style scoped>
.infinite-scroll {
  height: 100%;
}
</style>
