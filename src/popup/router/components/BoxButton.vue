<template>
  <RouterLink
    class="box-button"
    :to="to"
  >
    <slot />
  </RouterLink>
</template>

<script>
export default {
  props: {
    to: { type: [String, Object], required: true },
  },
};
</script>
<style lang="scss" scoped>
@import '../../../styles/variables';
@import '../../../styles/typography';

.box-button {
  width: 88px;
  height: 64px;
  background: $color-bg-2;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: $color-dark-grey;

  @extend %face-sans-15-medium;

  ::v-deep svg {
    width: 24px;
    height: 24px;
    color: $color-light-grey;
  }

  &:hover {
    background: rgba($color-blue, 0.15);

    &,
    ::v-deep svg {
      color: $color-blue;
    }
  }

  &:active {
    background-color: rgba($color-blue, 0.1);
  }
}
</style>
