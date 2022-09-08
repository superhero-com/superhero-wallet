<template>
  <div
    class="card"
    :class="{ 'is-big': isBig, clickable }"
    :style="styleComponent"
    @click="$emit('click', $event)"
  >
    <div class="card-icon">
      <slot
        name="icon"
        class="icon-svg"
      />
    </div>
    <div>
      <div class="title">
        {{ title }}
      </div>
      <div class="description">
        {{ description }}
      </div>
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'Card',
  props: {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    background: {
      type: String,
      default: null,
    },
    isBig: Boolean,
    clickable: Boolean,
  },
  computed: {
    styleComponent() {
      return {
        backgroundImage: (this.background)
          ? `url("${this.background}")`
          : null,
      };
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../../styles/variables';
@use '../../../../styles/typography';
@use '../../../../styles/mixins';

.card {
  width: 100%;
  background-color: variables.$color-bg-6;
  min-height: 116px;
  border-radius: 10px;
  padding: 16px;
  gap: 8px;
  background-repeat: no-repeat;
  background-size: cover;
  text-align: center;

  @include mixins.flex(center, center, column);

  &.clickable {
    cursor: pointer;
    transition: 0.4s;

    &:hover {
      background-color: variables.$color-disabled;
    }
  }

  .card-icon {
    height: 36px;
    width: 36px;
    min-width: 36px;
    background-color: rgba(variables.$color-white, 0.15);
    border-radius: 14px;

    @include mixins.flex(center, center);

    .icon-svg {
      height: 20px;
    }
  }

  .title {
    @extend %face-sans-16-bold;
  }

  .description {
    opacity: 0.7;
    margin-top: 4px;

    @extend %face-sans-13-medium;
  }

  &.is-big {
    flex-direction: row;
    align-items: start;
    gap: 16px;
    padding: 20px 16px;
    text-align: left;

    .card-icon {
      margin-top: 2px;
    }
  }
}
</style>
