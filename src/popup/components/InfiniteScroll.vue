<template>
  <div class="infinite-scroll" :class="{ 'virtual-enabled': virtualEnabled }">
    <div
      v-if="virtualEnabled"
      class="vs-container"
      :style="{ height: totalHeight }"
    >
      <div class="vs-spacer" :style="{ height: topPadding }" />
      <div class="vs-viewport">
        <div
          v-for="(item, i) in visibleItems"
          :key="getKey(item, startIndex + i)"
          :ref="(el) => onRowMount(el, startIndex + i)"
          class="vs-row"
        >
          <slot :item="item" :index="startIndex + i" />
        </div>
      </div>
      <div class="vs-spacer" :style="{ height: bottomPadding }" />
    </div>
    <template v-else>
      <slot />
    </template>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  watch,
  ref,
  computed,
  PropType,
  onBeforeUnmount,
} from 'vue';
import { useViewport } from '../../composables/viewport';

export default defineComponent({
  name: 'InfiniteScroll',
  props: {
    items: { type: Array as PropType<any[]>, default: undefined },
    // Estimated height used before an item is measured
    estimatedItemSize: { type: Number, default: 80 },
    overscan: { type: Number, default: 6 },
    virtual: { type: Boolean, default: false },
    keyExtractor: {
      type: Function as PropType<(item: any, index: number) => string | number>,
      default: undefined,
    },
  },
  emits: [
    'load-more',
  ],
  setup(props, { emit }) {
    const { viewportElement, onViewportScroll } = useViewport();

    const startIndex = ref(0);
    const endIndex = ref(0);
    const heights = ref<number[]>([]);
    const prefix = ref<number[]>([0]);
    const virtualEnabled = computed(() => Boolean(
      props.virtual && props.items && props.items.length,
    ));

    const measuredHeights = computed(() => heights.value.filter((h) => h > 0));
    const averageHeight = computed(() => (
      measuredHeights.value.length
        ? Math.round(
          measuredHeights.value.reduce((a, b) => a + b, 0) / measuredHeights.value.length,
        )
        : props.estimatedItemSize
    ));

    function ensureArrays() {
      const len = props.items?.length || 0;
      if (heights.value.length !== len) {
        heights.value = Array(len).fill(0);
      }
      if (prefix.value.length !== len + 1) {
        prefix.value = Array(len + 1).fill(0);
      }
    }

    function recomputePrefix() {
      ensureArrays();
      const len = props.items?.length || 0;
      prefix.value[0] = 0;
      for (let i = 0; i < len; i += 1) {
        const h = heights.value[i] || averageHeight.value;
        prefix.value[i + 1] = prefix.value[i] + h;
      }
    }

    const totalHeightPx = computed(() => prefix.value[prefix.value.length - 1] || 0);

    function getKey(item: any, index: number): string | number {
      return props.keyExtractor ? props.keyExtractor(item, index) : index;
    }

    function updateVirtualRange() {
      if (!virtualEnabled.value || !viewportElement.value) return;
      const el = viewportElement.value as Element & {
        scrollTop: number;
        clientHeight: number;
      };
      const scrollTop = el.scrollTop || 0;
      const clientHeight = el.clientHeight || 0;
      const overscanPx = props.overscan * averageHeight.value;
      const startOffset = Math.max(scrollTop - overscanPx, 0);
      const endOffset = scrollTop + clientHeight + overscanPx;

      // Binary search in prefix sums to find visible range
      const len = (props.items?.length || 0);
      let lo = 0;
      let hi = len;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (prefix.value[mid] <= startOffset) lo = mid + 1; else hi = mid;
      }
      const first = Math.max(lo - 1, 0);

      lo = first;
      hi = len;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (prefix.value[mid] < endOffset) lo = mid + 1; else hi = mid;
      }
      const last = Math.min(lo, len) - 1;

      startIndex.value = first;
      endIndex.value = Math.max(last, first);
    }

    // Batch scroll-driven updates
    let scrollScheduled = false;
    function scheduleRangeUpdate() {
      if (scrollScheduled) return;
      scrollScheduled = true;
      requestAnimationFrame(() => {
        scrollScheduled = false;
        const el = viewportElement.value as (
          Element & { scrollTop: number; scrollHeight?: number; clientHeight?: number }
        ) | undefined;
        const anchorIdx = startIndex.value;
        const oldPrefix = prefix.value[anchorIdx] || 0;
        const currentTop = el?.scrollTop || 0;
        const anchorOffset = currentTop - oldPrefix;
        updateVirtualRange();
        const newPrefix = prefix.value[anchorIdx] || 0;
        const delta = newPrefix - oldPrefix;
        if (el && Math.abs(delta) >= 1) {
          const target = newPrefix + anchorOffset;
          const maxScroll = Math.max((el.scrollHeight || 0) - (el.clientHeight || 0), 0);
          el.scrollTop = Math.max(0, Math.min(target, maxScroll));
        }
      });
    }

    const visibleItems = computed(() => {
      if (!virtualEnabled.value || !props.items) return [] as any[];
      return props.items.slice(startIndex.value, endIndex.value + 1);
    });

    const topPaddingPx = computed(() => prefix.value[startIndex.value] || 0);
    const bottomPaddingPx = computed(() => {
      if (!props.items) return 0;
      const endPrefix = prefix.value[endIndex.value + 1] || 0;
      return Math.max(totalHeightPx.value - endPrefix, 0);
    });

    watch(
      viewportElement,
      () => {
        recomputePrefix();
        scheduleRangeUpdate();
        onViewportScroll(({ isOutsideOfViewport }) => {
          scheduleRangeUpdate();
          if (isOutsideOfViewport) {
            emit('load-more');
          }
        });
      },
      { immediate: true },
    );

    watch(
      () => [props.items?.length, props.virtual, props.overscan, averageHeight.value],
      () => {
        ensureArrays();
        recomputePrefix();
        updateVirtualRange();
      },
    );

    // Measure rows with ResizeObserver
    const elementToIndex = new WeakMap<Element, number>();
    const indexToElement = new Map<number, Element>();
    const observedIndexes = new Set<number>();
    let scheduled = false;
    // Buffer measurements outside Vue reactivity to avoid observer->reactivity loops
    const pendingHeights = new Map<number, number>();
    const resizeObserver = new (window as any).ResizeObserver((entries: any[]) => {
      entries.forEach((entry: any) => {
        const { target, contentRect } = entry;
        const idx = elementToIndex.get(target as Element);
        if (idx !== undefined) {
          const height = contentRect?.height ?? 0;
          pendingHeights.set(idx, height);
        }
      });
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(() => {
          scheduled = false;
          let changed = false;
          pendingHeights.forEach((h, idx) => {
            const prev = heights.value[idx] ?? 0;
            if (Math.abs(prev - h) >= 0.5) {
              heights.value[idx] = h;
              changed = true;
            }
          });
          pendingHeights.clear();
          if (changed) {
            // Anchor scroll position to prevent visual jump when heights above change
            const anchorIndex = startIndex.value;
            const el = viewportElement.value as Element & { scrollTop: number } | undefined;
            const oldTop = prefix.value[anchorIndex] || 0;
            recomputePrefix();
            const newTop = prefix.value[anchorIndex] || 0;
            if (el && newTop !== oldTop) {
              el.scrollTop += (newTop - oldTop);
            }
            updateVirtualRange();
            // Prune observers that are far outside of the window
            const start = Math.max(startIndex.value - 2, 0);
            const end = endIndex.value + 2;
            observedIndexes.forEach((i) => {
              if (i < start || i > end) {
                const e = indexToElement.get(i);
                if (e) resizeObserver.unobserve(e);
                indexToElement.delete(i);
                observedIndexes.delete(i);
              }
            });
          }
        });
      }
    });

    function onRowMount(el: any, index: number) {
      const prev = indexToElement.get(index);
      if (prev && prev !== el) {
        resizeObserver.unobserve(prev);
        indexToElement.delete(index);
        observedIndexes.delete(index);
      }
      if (!el) {
        return;
      }
      const target = (el as Element);
      elementToIndex.set(target, index);
      indexToElement.set(index, target);
      resizeObserver.observe(target);
      observedIndexes.add(index);
    }

    onBeforeUnmount(() => {
      resizeObserver.disconnect();
      indexToElement.clear();
      observedIndexes.clear();
    });

    return {
      getKey,
      virtualEnabled,
      totalHeight: computed(() => `${totalHeightPx.value}px`),
      visibleItems,
      startIndex,
      topPadding: computed(() => `${topPaddingPx.value}px`),
      bottomPadding: computed(() => `${bottomPaddingPx.value}px`),
      onRowMount,
    };
  },
});
</script>

<style lang="scss" scoped>
.infinite-scroll {
  height: 100%;

  .vs-container {
    position: relative;
    width: 100%;

    .vs-viewport {
      width: 100%;

      .vs-row {
        contain: content;
      }
    }

    .vs-spacer {
      width: 100%;
      pointer-events: none;
    }
  }

  /* Progressive rendering hint when not virtualizing */
  > * {
    content-visibility: auto;
    contain-intrinsic-size: 1px 80px;
  }

  &.virtual-enabled > * {
    content-visibility: visible;
  }
}
</style>
