<template>
  <BtnBase
    v-bind="$attrs"
    class="button-subheader"
    extend
    variant="dark"
    @click="$emit('click')"
  >
    <div class="box">
      <IconWrapper
        v-if="icon"
        :icon="icon"
        is-boxed
      />

      <div class="message">
        <span class="heading">{{ header }}</span>
        <span class="description">{{ subheader }}</span>
      </div>
    </div>
  </BtnBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import IconWrapper from '../IconWrapper.vue';
import BtnBase from './BtnBase.vue';

export default defineComponent({
  components: {
    BtnBase,
    IconWrapper,
  },
  props: {
    header: { type: String, default: '' },
    subheader: { type: String, default: '' },
    icon: { type: Object, default: null },
  },
  emits: ['click'],
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.button-subheader {
  width: 100%;
  min-height: 80px;
  margin-bottom: 16px;
  padding: 6px 12px;
  border-radius: variables.$border-radius-interactive;
  color: variables.$color-white;

  .box {
    @include mixins.flex(flex-start, center);

    gap: 16px;
    margin-right: auto;
    text-align: left;
  }

  .message {
    @include mixins.flex(flex-start, flex-start, column);

    .heading {
      @extend %face-sans-16-medium;

      line-height: 150%;
    }

    .description {
      @extend %face-sans-13-regular;

      opacity: 0.7;
    }
  }
}
</style>
