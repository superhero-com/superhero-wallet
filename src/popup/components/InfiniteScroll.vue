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
  emits: [
    'load-more',
  ],
  setup(props, { emit }) {
    const { viewportElement, onViewportScroll } = useViewport();

    watch(
      viewportElement,
      () => {
        onViewportScroll(({ isOutsideOfViewport }) => {
          if (isOutsideOfViewport) {
            emit('load-more');
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
