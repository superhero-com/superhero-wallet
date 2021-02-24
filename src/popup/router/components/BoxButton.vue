<template>
  <div class="box-button">
    <RouterLink :to="to">
      <component :is="icon" class="icon" />
      <span class="text">{{ text }}</span>
    </RouterLink>
  </div>
</template>

<script>
export default {
  props: {
    text: { type: String, required: true },
    icon: { type: Object, required: true },
    to: { type: String, required: true },
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

    .icon {
      width: 24px;
      height: 24px;
      opacity: 0.7;
    }

    .text {
      @extend %face-sans-15-medium;

      line-height: 24px;
      color: $color-dark-grey;
    }

    &:hover {
      background: $color-blue-alpha-15;

      .icon {
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
      background-color: rgba($color-blue-alpha-15, 0.1);
    }
  }
}
</style>
