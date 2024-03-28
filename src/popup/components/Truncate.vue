<template>
  <div
    class="truncate"
    :class="{ right }"
  >
    <span
      ref="container"
      class="container"
      :class="{
        fixed,
        scrollable: shouldScroll,
      }"
      :style="{
        '--animationTranslate': animationTranslate,
        '--animationDuration': animationDuration,
      }"
    >
      <span
        ref="scroll"
        class="inner"
      >
        {{ nameComponent }}
      </span>
    </span>
    <span
      v-if="nameComponent !== str"
      class="domain"
      v-text="AE_AENS_DOMAIN"
    />
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  ref,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
} from 'vue';
import { AE_AENS_DOMAIN } from '@/protocols/aeternity/config';
import { debounce } from 'lodash-es';

export default defineComponent({
  props: {
    str: { type: String, required: true },
    fixed: Boolean,
    right: Boolean,
  },
  setup(props) {
    const container = ref<HTMLDivElement>();
    const scroll = ref<HTMLDivElement>();
    const shouldScroll = ref(false);
    const animationTranslate = ref<string>();
    const animationDuration = ref<string>();

    let resizeObserver: ResizeObserver;

    const nameComponent = computed(() => props.str?.endsWith(AE_AENS_DOMAIN)
      ? props.str.replace(AE_AENS_DOMAIN, '')
      : props.str);

    const calculateTruncate = async () => {
      shouldScroll.value = false;
      await nextTick();
      if (!props.fixed && scroll.value && container.value?.clientWidth) {
        const { clientWidth } = container.value;
        const { clientWidth: scrollWidth } = scroll.value;
        const animationWidth = scrollWidth - clientWidth;
        const PADDING_WIDTH = 2;

        if (scrollWidth > clientWidth) {
          animationTranslate.value = `-${animationWidth + PADDING_WIDTH}px`;
          animationDuration.value = `${(animationWidth + PADDING_WIDTH) * 200}ms`;
          shouldScroll.value = true;
        }
      }
    };

    /**
     * Observe container size changes
     * in order to correctly truncate when container size changes
     */
    function observeContainerSize() {
      resizeObserver = new ResizeObserver(
        debounce(() => {
          calculateTruncate();
        }, 100),
      );
      resizeObserver.observe(container.value!);
    }

    watch(nameComponent, calculateTruncate);

    onMounted(() => {
      observeContainerSize();
      // sometimes setTimeout is needed for scroll to calculate proper width
      setTimeout(() => {
        calculateTruncate();
      }, 500);
    });

    onBeforeUnmount(() => {
      if (container.value && resizeObserver) {
        resizeObserver.disconnect();
      }
    });

    return {
      AE_AENS_DOMAIN,
      container,
      scroll,
      shouldScroll,
      nameComponent,
      animationTranslate,
      animationDuration,
    };
  },
});
</script>

<style lang="scss" scoped>
.truncate {
  display: flex;
  width: 100%;
  min-width: 0;
  padding-right: 5px;

  &.right {
    justify-content: flex-end;
  }

  .container {
    position: relative;
    overflow: hidden;
    white-space: nowrap;

    &.fixed {
      text-overflow: ellipsis;
    }

    .inner {
      position: relative;
      display: inline-block;
      min-width: fit-content;
    }

    &.scrollable {
      padding-right: 5px;
      border-radius: 2px;
      margin-left: -2px;
      mask-image:
        linear-gradient(
          90deg,
          rgba(black, 0) 0%,
          rgba(black, 1) 2px,
          rgba(black, 1) calc(100% - 2px),
          rgba(black, 0) 100%
        );

      .inner {
        position: relative;
        display: inline-block;
        animation-name: animationTruncate;
        animation-duration: var(--animationDuration);
        animation-delay: 1.5s;
        animation-iteration-count: infinite;
        animation-timing-function: linear;
        padding: 0 2px;
      }
    }
  }

  .domain {
    word-break: keep-all;
  }

  @keyframes animationTruncate {
    0% {
      transform: translateX(0);
    }

    50% {
      transform: translateX(var(--animationTranslate));
    }

    100% {
      transform: translateX(0);
    }
  }
}
</style>
