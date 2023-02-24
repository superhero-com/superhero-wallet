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
      :style="cssVars"
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

    const cssVars = computed(() => ({
      '--beforeWidth': (props.fixed) ? 0 : '4px',
    }));

    onMounted(() => {
      watch(
        () => props.str,
        () => {
          shouldScroll.value = false;

          if (!props.fixed && scroll.value && container.value) {
            const { scrollWidth, offsetWidth } = container.value;

            if (scrollWidth > offsetWidth) {
              shouldScroll.value = true;
              scroll.value.animate(
                [{ transform: `translateX(calc(-${scrollWidth - offsetWidth}px - var(--beforeWidth)))` }],
                {
                  delay: 2000,
                  duration: 6000,
                  direction: 'alternate',
                  iterations: Infinity,
                },
              );
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
      cssVars,
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
        display: inline-block;
        transition: all 0.3s ease-out;
      }
    }
  }

  .domain {
    word-break: keep-all;
  }
}
</style>
