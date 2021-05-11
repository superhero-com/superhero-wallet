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
@use '../../../styles/variables';
@use '../../../styles/typography';

.box-button {
  width: 88px;
  height: 64px;
  background: variables.$color-bg-2;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: variables.$color-dark-grey;

  @extend %face-sans-15-medium;

  ::v-deep svg {
    width: 24px;
    height: 24px;
    color: variables.$color-light-grey;
  }

  &:hover {
    background: rgba(variables.$color-blue, 0.15);

    &,
    ::v-deep svg {
      color: variables.$color-blue;
    }
  }

  &:active {
    background-color: rgba(variables.$color-blue, 0.1);
  }
}
</style>
