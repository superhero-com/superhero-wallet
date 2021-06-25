<template>
  <span class="truncate">
    <span
      class="container"
      :style="cssVars"
    >
      <span ref="scroll">{{ nameComponent || str }}</span>
    </span>
    <span v-if="nameComponent">{{ '.chain' }}</span>
  </span>
</template>

<script>
export default {
  props: {
    str: { type: String, required: true },
  },
  computed: {
    nameComponent() {
      return this.str.endsWith('.chain') ? this.str.replace('.chain', '') : '';
    },
    cssVars() {
      return {
        '--beforeWidth': '4px',
      };
    },
  },
  mounted() {
    document.fonts.ready.then(() => {
      const scrollElement = this.$refs.scroll;
      const { parentElement } = scrollElement;
      const { scrollWidth, offsetWidth } = parentElement;

      if (scrollWidth > offsetWidth) {
        parentElement.classList.add('scrollable');
        this.animation = scrollElement.animate(
          [{ transform: `translateX(calc(-${scrollWidth - offsetWidth}px - var(--beforeWidth)))` }],
          {
            delay: 2000,
            duration: 4000,
            direction: 'alternate',
            iterations: Infinity,
          },
        );
      }
    });
  },
};
</script>

<style lang="scss" scoped>
.truncate {
  display: flex;

  .container {
    position: relative;
    overflow: hidden;
    white-space: nowrap;

    &.scrollable {
      border-radius: 2px;

      span {
        display: inline-block;
        transition: all 0.3s ease-out;
      }

      &::before,
      &::after {
        content: '';
        position: absolute;
        right: 0;
        width: var(--beforeWidth);
        height: 100%;
        background: linear-gradient(270deg, black, transparent);
      }

      &::before {
        z-index: 1;
        left: 0;
        opacity: 0;
        background: linear-gradient(90deg, black, transparent);
        animation-name: fade;
        animation-duration: 8s;
        animation-delay: 2s;
        animation-iteration-count: infinite;

        @keyframes fade {
          100% {
            opacity: 1;
          }
        }
      }
    }
  }
}
</style>
