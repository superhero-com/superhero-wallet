<template>
  <BtnBase
    v-bind="$attrs"
    class="btn-main"
    :class="[
      {
        extend,
        third,
        inline,
        nowrap,
        wide,
        'extra-padded': extraPadded,
        'has-icon': !!icon,
      },
    ]"
  >
    <Component
      :is="icon"
      v-if="icon"
      class="btn-main-icon"
      :class="{ lg: bigIcon }"
    />

    <slot>{{ text }}</slot>
  </BtnBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import BtnBase from './BtnBase.vue';

export default defineComponent({
  components: {
    BtnBase,
  },
  props: {
    text: { type: String, default: '' },
    icon: { type: Object, default: null },
    extend: Boolean,
    third: Boolean,
    inline: Boolean,
    nowrap: Boolean,
    // Used for footer buttons that should take 60% of the space
    wide: Boolean,
    // Add more inner space on the sides. Useful with buttons with short text like 'OK'.
    extraPadded: Boolean,
    // Enlarges the icon from 20px to 24px
    bigIcon: Boolean,
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.btn-main {
  --bg-color: #{$color-primary};

  @extend %text-body;

  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  width: fit-content;
  min-height: 40px;
  padding: 8px 16px;
  border-radius: $border-radius-interactive;
  line-height: 24px;
  font-weight: 500;
  text-align: center;

  &.extra-padded {
    padding-inline: 32px;
  }

  &.third {
    display: inline-block;
    width: 32%;
    margin: 0;
  }

  &.inline {
    display: inline-flex;
  }

  &.nowrap {
    white-space: nowrap;
  }

  &.has-icon {
    gap: 4px;

    .btn-main-icon {
      --icon-size: var(--icon-size-md);

      flex-shrink: 0;
      width: var(--icon-size);
      height: var(--icon-size);
      color: inherit;

      &.lg {
        --icon-size: var(--icon-size-lg);
      }
    }
  }

  &.wide {
    flex-basis: 60%;
  }

  &.extend {
    width: 100%;
  }
}
</style>
