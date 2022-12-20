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
        'extra-padded': extraPadded,
        'has-icon': !!icon,
      },
    ]"
    v-on="$listeners"
  >
    <Component
      :is="icon"
      v-if="icon"
      class="btn-main-icon"
    />

    <slot>{{ text }}</slot>
  </BtnBase>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
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
    // Add more inner space on the sides. Useful with buttons with short text like 'OK'.
    extraPadded: Boolean,
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables' as *;
@use '../../../styles/typography';

.btn-main {
  --bg-color: #{$color-primary};

  @extend %face-sans-16-regular;

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
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      color: inherit;
    }
  }

  &.extend {
    width: 100%;
  }
}
</style>
