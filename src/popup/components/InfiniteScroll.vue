<template>
  <div
    ref="scrollArea"
    class="infinite-scroll"
    @scroll="onScroll"
  >
    <slot />
  </div>
</template>

<script lang="ts">
import {
  defineComponent, onMounted, onUnmounted,
} from '@vue/composition-api';

export default defineComponent({
  name: 'InfiniteScroll',
  props: {
    isMoreData: { type: Boolean, required: true },
  },
  setup(props, { emit }) {
    const appInner = document.querySelector('.app-inner')!;

    const onScroll = () => {
      const isDesktop = document.documentElement.clientWidth > 480 || process.env.IS_EXTENSION;
      const { scrollHeight, scrollTop, clientHeight } = isDesktop
        ? appInner : document.documentElement;
      if (props.isMoreData && (scrollHeight - scrollTop <= clientHeight + 100)) {
        emit('loadMore');
      }
    };

    onMounted(() => {
      appInner.addEventListener('scroll', onScroll);
      window.addEventListener('scroll', onScroll);
    });

    onUnmounted(() => {
      appInner.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', onScroll);
    });

    return {
      onScroll,
    };
  },
});
</script>

<style scoped>
  .infinite-scroll {
    height: 100%;
  }
</style>
