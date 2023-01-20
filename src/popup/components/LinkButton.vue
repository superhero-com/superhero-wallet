<template>
  <a
    class="link-button"
    :href="to"
    target="blank"
  >
    <slot />
  </a>
</template>

<script>
export default {
  name: 'LinkButton',
  props: {
    to: { type: String, required: true },
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.link-button {
  @extend %face-sans-14-regular;

  padding: 0;
  display: inline-flex;
  gap: 4px;
  align-items: center;
  color: variables.$color-success;

  svg {
    width: 24px;
    height: 24px;
    opacity: 0.44;
    color: variables.$color-white;
  }

  &:hover {
    color: variables.$color-success-hover;

    svg {
      opacity: 1;
      color: variables.$color-success;
    }
  }

  &:active {
    opacity: 0.7;

    svg {
      opacity: 0.7;
      color: variables.$color-success;
    }
  }
}
</style>
