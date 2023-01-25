<template>
  <div
    class="truncate"
    :class="{ right }"
  >
    <span
      ref="container"
      class="container"
      :class="{ fixed }"
      :style="cssVars"
    >
      <span ref="scroll">{{ nameComponent || str }}</span>
    </span>
    <span
      v-if="nameComponent"
      class="domain"
    >{{ AENS_DOMAIN }}</span>
  </div>
</template>

<script>
import { AENS_DOMAIN } from '../utils';

export default {
  props: {
    str: { type: String, required: true },
    gradientColor: { type: String, default: 'black' },
    fixed: Boolean,
    right: Boolean,
  },
  data: () => ({
    AENS_DOMAIN,
  }),
  computed: {
    nameComponent() {
      return this.str?.endsWith(AENS_DOMAIN) ? this.str.replace(AENS_DOMAIN, '') : '';
    },
    cssVars() {
      if (this.fixed) {
        return {
          '--gradientColor': this.gradientColor,
        };
      }
      return {
        '--beforeWidth': '4px',
        '--gradientColor': this.gradientColor,
      };
    },
  },
  watch: {
    str: {
      async handler() {
        if (this.fixed) return;
        document.fonts.ready.then(() => {
          const scrollElem = this.$refs.scroll;
          const containerElem = this.$refs.container;

          if (scrollElem && containerElem) {
            const { scrollWidth, offsetWidth } = containerElem;

            if (scrollWidth > offsetWidth) {
              containerElem.classList.add('scrollable');
              this.animation = scrollElem.animate(
                [{ transform: `translateX(calc(-${scrollWidth - offsetWidth}px - var(--beforeWidth)))` }],
                {
                  delay: 2000,
                  duration: 4000,
                  direction: 'alternate',
                  iterations: Infinity,
                },
              );
            }
          }
        });
      },
      immediate: true,
    },
  },
};
</script>

<style lang="scss" scoped>
.truncate {
  display: flex;

  &.right {
    justify-content: flex-end;
  }

  .container {
    position: relative;
    overflow: hidden;
    white-space: nowrap;

    &.fixed {
      text-overflow: ellipsis;
    }

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
        background: linear-gradient(270deg, var(--gradientColor), transparent);
      }

      &::before {
        z-index: 1;
        left: 0;
        opacity: 0;
        background: linear-gradient(90deg, var(--gradientColor), transparent);
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

  .domain {
    word-break: keep-all;
  }
}
</style>
