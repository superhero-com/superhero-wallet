<template>
  <BtnBase
    v-bind="{ ...$attrs, ...$props }"
    class="button-subheader"
    extend
    variant="dark"
  >
    <div class="box">
      <IconWrapper
        v-if="icon || protocolIcon"
        :icon="icon"
        :icon-size="iconSize"
        :protocol-icon="protocolIcon"
        is-boxed
        class="icon-wrapper"
      />

      <div class="message">
        <span class="heading">{{ header }}</span>
        <span class="description">{{ subheader }}</span>
      </div>
    </div>
  </BtnBase>
</template>

<script lang="ts">
import { Component, PropType, defineComponent } from 'vue';
import IconWrapper, { iconSizeProp, protocolIconProp } from '../IconWrapper.vue';
import BtnBase, { btnBaseProps } from './BtnBase.vue';

export default defineComponent({
  components: {
    BtnBase,
    IconWrapper,
  },
  props: {
    header: { type: String, default: '' },
    subheader: { type: String, default: '' },
    icon: { type: Object as PropType<Component>, default: null },
    iconSize: iconSizeProp,
    protocolIcon: protocolIconProp,
    ...btnBaseProps,
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.button-subheader {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 20px 16px;
  border-radius: $border-radius-interactive;
  color: $color-white;

  &:not(:last-child) {
    margin-bottom: 16px;
  }

  .box {
    @include mixins.flex(flex-start, center);

    gap: 16px;
    margin-right: auto;
    text-align: left;

    .icon-wrapper {
      color: rgba($color-white, 0.85);
    }
  }

  .message {
    @include mixins.flex(flex-start, flex-start, column);

    .heading {
      @extend %face-sans-16-semi-bold;

      line-height: 150%;
    }

    .description {
      @extend %face-sans-13-regular;

      opacity: 0.7;
    }
  }
}
</style>
