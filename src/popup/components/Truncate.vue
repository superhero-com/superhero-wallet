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
        v-text="nameComponent || str"
      />
    </span>

    <span
      v-if="nameComponent"
      class="domain"
      v-text="AENS_DOMAIN"
    />
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  ref,
  watch,
} from '@vue/composition-api';
import { AENS_DOMAIN } from '../utils';

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
    const nameComponent = computed(() => props.str?.endsWith(AENS_DOMAIN) ? props.str.replace(AENS_DOMAIN, '') : '');

    const animationTranslate = ref<string>();
    const animationDuration = ref<string>();

    onMounted(() => {
      watch(
        () => props.str,
        () => {
          shouldScroll.value = false;

          if (!props.fixed && scroll.value && container.value) {
            const { scrollWidth, offsetWidth } = container.value;

            const animationWidth = scrollWidth - offsetWidth;

            if (scrollWidth > offsetWidth) {
              animationTranslate.value = `-${(animationWidth - (props.fixed ? 0 : 4))}px`;
              animationDuration.value = `${animationWidth * 100}ms`;
              shouldScroll.value = true;
            }
          }
        },
        { immediate: true },
      );
    });

    return {
      AENS_DOMAIN,
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
  max-width: 100%;

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

    &.scrollable {
      border-radius: 2px;
      mask-image:
        linear-gradient(
          90deg,
          rgba(black, 0) 0%,
          rgba(black, 1) 5%,
          rgba(black, 1) 95%,
          rgba(black, 0) 100%
        );

      .inner {
        position: relative;
        display: inline-block;
        animation-name: animationTruncate;
        animation-duration: var(--animationDuration);
        animation-delay: 1s;
        animation-iteration-count: infinite;
        animation-timing-function: cubic-bezier(0.42, 0, 0.58, 1);
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
