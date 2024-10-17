<template>
  <div
    ref="horizontalScrollEl"
    class="horizontal-scroll"
    @scroll="onScroll"
    @mousedown="onMouseDown"
  >
    <slot />
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue';

export default defineComponent({
  setup() {
    const horizontalScrollEl = ref<HTMLElement>();
    const originX = ref(0);
    const originLeft = ref(0);
    const left = ref(0);

    function onMouseMove(e: MouseEvent) {
      const offset = e.pageX - originX.value;
      const scrollLeft = originLeft.value - offset;
      horizontalScrollEl.value?.scroll({ left: scrollLeft, behavior: 'auto' });
    }

    function onMouseUp() {
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
    }

    function onMouseDown(e: MouseEvent) {
      originX.value = e.pageX;
      originLeft.value = left.value;

      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('mousemove', onMouseMove);
    }

    function onScroll(e: Event) {
      left.value = e.target ? (e.target as HTMLElement).scrollLeft : 0;
    }

    function onWheel(e: WheelEvent) {
      if (horizontalScrollEl.value && e.deltaX === 0) {
        horizontalScrollEl.value.scrollLeft += e.deltaY;
      }
    }

    onMounted(() => {
      // Allow buttons to scroll horizontally with mouse wheel
      horizontalScrollEl.value?.addEventListener('wheel', onWheel, { passive: true });
    });

    onBeforeUnmount(() => {
      onMouseUp();
      horizontalScrollEl.value?.removeEventListener('wheel', onWheel);
    });

    return {
      horizontalScrollEl,
      onMouseDown,
      onMouseUp,
      onScroll,
    };
  },
});
</script>

<style scoped lang="scss">
.horizontal-scroll {
  cursor: move;
}
</style>
