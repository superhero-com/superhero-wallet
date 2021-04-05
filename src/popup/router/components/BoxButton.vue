<template>
  <div class="box-button">
    <RouterLink :to="to">
      <slot name="icon" />
      <span class="text">{{ text }}</span>
    </RouterLink>
  </div>
</template>

<script>
export default {
  props: {
    to: { type: String, required: true },
    text: { type: String, required: true },
  },
};
</script>
<style lang="scss" scoped>
@import '../../../styles/variables';
@import '../../../styles/typography';

.box-button {
  a {
    width: 88px;
    height: 64px;
    background: $color-bg-2;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    user-select: none;
    cursor: pointer;

    ::v-deep svg {
      width: 24px;
      height: 24px;
      opacity: 0.7;
    }

    .text {
      @extend %face-sans-15-medium;

      color: $color-dark-grey;
    }

    &:hover {
      background: rgba($color-blue, 0.15);

      ::v-deep svg {
        opacity: 1;

        path {
          fill: $color-blue;
        }
      }

      .text {
        color: $color-blue;
      }
    }

    &:active {
      background-color: rgba($color-blue, 0.1);
    }
  }
}
</style>
