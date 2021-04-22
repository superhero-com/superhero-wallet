<template>
  <div class="tabs">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.tabs {
  display: flex;

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

    &:first-child {
      border-bottom-left-radius: 2px;
    }

    &:last-child {
      border-bottom-right-radius: 2px;
    }

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
}
</style>
