<template>
  <Button
    v-bind="$attrs"
    class="button-subheader"
    :to="to"
    new-ui
    extend
    fill="alternative"
    @click="$emit('click')"
  >
    <div class="box">
      <span class="icon">
        <slot />
      </span>

      <div class="message">
        <span class="heading">{{ header }}</span>
        <span class="description">{{ subheader }}</span>
      </div>
    </div>
  </Button>
</template>

<script>
import Button from './Button.vue';

export default {
  components: {
    Button,
  },
  props: {
    to: { type: [String, Object], default: '' },
    header: { type: String, default: '' },
    subheader: { type: String, default: '' },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.button-subheader {
  height: 80px;
  margin-bottom: 16px;
  cursor: pointer;

  .box {
    @include mixins.flex(flex-start, center);

    text-decoration: none;
    color: variables.$color-dark-grey;
    gap: 16px;
    margin-right: auto;

    .icon {
      @include mixins.flex(center, center);

      width: 36px;
      height: 36px;
      border-radius: 14px;
      background-color: rgba(variables.$color-white, 0.1);

      ::v-deep svg {
        width: 22px;
        height: 22px;
        color: variables.$color-white;
      }
    }
  }

  .message {
    @include mixins.flex(flex-start, flex-start, column);

    .heading {
      @extend %face-sans-16-medium;

      line-height: 150%;
      color: variables.$color-white;
    }

    .description {
      @extend %face-sans-13-regular;

      color: rgba(variables.$color-white, 0.7);
    }
  }
}
</style>
