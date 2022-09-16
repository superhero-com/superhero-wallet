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
  padding: 0;
  display: inline-flex;
  align-items: center;

  @extend %face-sans-14-regular;

  color: variables.$color-green;

  svg {
    width: 24px;
    height: 24px;
    margin-right: 4px;
    opacity: 0.44;
    color: variables.$color-white;
  }

  &:hover {
    color: variables.$color-green-hover;

    svg {
      opacity: 1;
      color: variables.$color-green;
    }
  }

  &:active {
    opacity: 0.7;

    svg {
      opacity: 0.7;
      color: variables.$color-green;
    }
  }
}
</style>
