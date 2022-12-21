<template>
  <div class="infinite-scroll">
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { IScrollCallbackParams, useViewport } from '../../composables/viewport';

export default defineComponent({
  name: 'InfiniteScroll',
  props: {
    isMoreData: { type: Boolean, required: true },
  },
  setup(props, { emit }) {
    const { onViewportScroll } = useViewport();

    function onScroll({ isOutsideOfViewport }: IScrollCallbackParams) {
      if (props.isMoreData && isOutsideOfViewport) {
        emit('loadMore');
      }
    }

    onViewportScroll(onScroll);
  },
});
</script>

<style scoped>
.infinite-scroll {
  height: 100%;
}
</style>
