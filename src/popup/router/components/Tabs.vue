<template>
  <div :class="['tabs', { three }]">
    <slot />
  </div>
</template>

<script>
export default {
  props: { three: Boolean },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.tabs {
  display: flex;

  &.three a {
    height: 40px;
    background-color: transparent;
    border-radius: 50px;
    color: variables.$color-light-grey;

    ::v-deep svg {
      opacity: 0.7;
    }

    &:hover {
      background-color: variables.$color-hover;
    }

    &:hover,
    &.router-link-active {
      ::v-deep svg {
        opacity: 1;
      }
    }
  }

  a {
    flex: 1 0;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 50px;
    text-decoration: none;

    @extend %face-sans-16-medium;

    color: variables.$color-dark-grey;
    background-color: variables.$color-bg-2;
    border-radius: 0 0 4px 4px;

    &:hover {
      background-color: variables.$color-border;
    }

    &.router-link-active {
      color: variables.$color-green;

      &,
      &:hover {
        background-color: variables.$color-bg-3;
      }
    }

    ::v-deep svg {
      width: 24px;
      margin-right: 6px;
    }
  }

  &:not(.three) a {
    &:first-child {
      border-bottom-left-radius: 2px;
    }

    &:last-child {
      border-bottom-right-radius: 2px;
    }
  }
}
</style>
