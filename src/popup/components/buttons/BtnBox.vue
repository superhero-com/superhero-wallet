<template>
  <BtnBase
    v-bind="$attrs"
    class="btn-box"
    variant="dark"
    :disabled="disabled"
    :class="{
      disabled,
      'is-big': isBig,
    }"
  >
    <IconWrapper
      v-if="icon"
      class="icon"
      :icon="icon"
      :is-boxed="isBig"
    />

    <span
      v-if="text"
      class="text"
      v-text="text"
    />

    <span
      v-if="isBig && subtitle"
      class="subtitle"
      v-text="subtitle"
    />
  </BtnBase>
</template>

<script>
import IconWrapper from '../IconWrapper.vue';
import BtnBase from './BtnBase.vue';

export default {
  components: {
    BtnBase,
    IconWrapper,
  },
  props: {
    text: { type: String, default: null },
    subtitle: { type: String, default: null },
    icon: { type: Object, default: null },
    disabled: Boolean,
    isBig: Boolean,
  },
};
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.btn-box {
  @extend %face-sans-14-medium;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: auto;
  min-height: 58px;
  padding: 4px 6px;
  border-radius: $border-radius-interactive;

  &:hover {
    .icon {
      opacity: 1;
    }
  }

  .icon {
    color: $color-white;
    opacity: 0.75;
  }

  .subtitle {
    @extend %face-sans-13-regular;

    opacity: 0.7;
  }

  &.disabled {
    .icon {
      opacity: 0.5;
    }
  }

  &.is-big {
    min-height: 116px;
    padding: 10px;

    .icon {
      margin-bottom: 8px;
    }

    .text {
      @extend %face-sans-16-bold;
    }
  }
}
</style>
