<template>
  <span
    ref="tooltip"
    :class="[`tooltip-${position}`]"
    :data-tooltip="tooltip"
  >
    <slot />
  </span>
</template>

<script>
export default {
  props: {
    tooltip: { type: String, required: true },
  },
  data() {
    return {
      position: 'top',
    };
  },
  mounted() {
    const tooltip = this.$refs.tooltip.getBoundingClientRect();
    const offsets = document.getElementById('app').getBoundingClientRect();
    const width = offsets.right - offsets.left;

    if (tooltip.left > (offsets.left + (width / 2))) {
      this.position = 'left';
    } else {
      this.position = 'right';
    }
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';

[data-tooltip] {
  $triangle: 0.3rem;
  $background-color: rgba(51, 51, 51, 0.9);

  cursor: pointer;
  display: inline-block;
  line-height: 1;
  position: relative;

  &::after {
    background-color: $background-color;
    border-radius: $triangle;
    color: #fff;
    content: attr(data-tooltip);
    font-size: 85%;
    font-weight: normal;
    line-height: 1.15rem;
    opacity: 0;
    padding: 0.25rem 0.5rem;
    position: absolute;
    text-align: center;
    text-transform: none;
    transition: opacity 0.2s;
    visibility: hidden;
    white-space: nowrap;
    z-index: 1;
  }

  $xy-border: (
    top: t,
    bottom: b,
    left: l,
    right: r
  );

  @each $direction, $d in $xy-border {
    &.tooltip-#{$direction} {
      // arrows

      &::before {
        border-style: solid;
        border-width: $triangle;
        content: "";
        opacity: 0;
        position: absolute;
        transition: opacity 0.2s;
        visibility: hidden;

        @if $direction == top {
          border-color: $background-color transparent transparent transparent;
          top: 0;
          left: 50%;
          margin-left: -$triangle;
        }

        @else if $direction == bottom {
          border-color: transparent transparent $background-color transparent;
          bottom: 0;
          left: 50%;
          margin-left: -$triangle;
        }

        @else if $direction == left {
          border-color: transparent transparent transparent $background-color;
          top: $triangle;
          right: calc(110% - #{$triangle});
          margin-top: -$triangle;
        }

        @else if $direction == right {
          border-color: transparent $background-color transparent transparent;
          top: $triangle;
          left: calc(110% - #{$triangle});
          margin-top: -$triangle;
        }
      }

      &::after {
        @if $direction == top {
          bottom: 100%;
          left: 50%;
          transform: translate(-50%);
        }

        @else if $direction == bottom {
          top: 100%;
          left: 50%;
          transform: translate(-50%);
        }

        @else if $direction == left {
          top: -$triangle;
          right: calc(110% + #{$triangle});
        }

        @else if $direction == right {
          top: -$triangle;
          left: calc(110% + #{$triangle});
        }
      }
    }
  }

  &.tooltip-mobile {
    @media (max-width: 767px) {
      &::before {
        display: none;
      }

      &::after {
        font-size: 1rem;
        max-width: 20rem;
        position: fixed;
        bottom: auto;
        top: 50%;
        left: 50%;
        text-align: left;
        transform: translate(-50%);
        white-space: normal;
      }
    }
  }

  &:hover::after,
  &[class*=tooltip-]:hover::before {
    visibility: visible;
    opacity: 1;
  }
}

</style>
