<template>
  <transition
    appear
    :name="fromBottom ? 'from-bottom-transition' : 'pop-in-transition'"
    @after-enter="$emit('opened')"
  >
    <div
      class="modal"
      :class="{
        'full-screen': fullScreen,
        'from-bottom': fromBottom,
        'has-close-button': hasCloseButton,
        'no-padding': noPadding,
        dense,
        'blur-bg': !noBlur
      }"
    >
      <div class="container">
        <div
          v-if="$slots.header || header || hasCloseButton"
          class="header"
          :class="{ transparent: hasCloseButton && !($slots.header || header) }"
        >
          <div
            v-if="$slots.icon"
            class="header-icon"
          >
            <slot name="icon" />
          </div>

          <slot name="header">
            <div class="header-default-text">
              {{ header }}
            </div>
          </slot>

          <ButtonIcon
            v-if="hasCloseButton"
            class="close-button"
            @click="$emit('close')"
          >
            <Close />
          </ButtonIcon>
        </div>

        <div
          v-if="$slots.default"
          class="body"
          :class="{ 'text-center': centered }"
        >
          <slot />
        </div>

        <div
          v-if="$slots.footer"
          class="footer"
        >
          <slot name="footer" />
        </div>
        <NodeConnectionStatus v-if="fullScreen" />
      </div>

      <div
        class="cover"
        @click="$emit('close')"
      />
    </div>
  </transition>
</template>

<script>
import ButtonIcon from './ButtonIcon.vue';
import Close from '../../../icons/close.svg?vue-component';
import NodeConnectionStatus from './NodeConnectionStatus.vue';

export default {
  components: {
    ButtonIcon,
    Close,
    NodeConnectionStatus,
  },
  props: {
    hasCloseButton: Boolean,
    fullScreen: Boolean,
    fromBottom: Boolean,
    dense: Boolean,
    noPadding: Boolean,
    noBlur: Boolean,
    centered: Boolean,
    header: { type: String, default: null },
  },
  emits: [
    'close',
  ],
  mounted() {
    if (document.body.style.overflow) return;
    document.body.style.overflow = 'hidden';
  },
  beforeDestroy() {
    document.body.style.overflow = '';
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.modal {
  --screen-padding-x: 24px; // Default spacing
  --screen-bg-color: #{variables.$color-bg-modal};

  position: fixed;
  z-index: 2;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  min-width: variables.$extension-width;
  background-color: rgba(variables.$color-black, 0.7);
  display: flex;

  &.blur-bg {
    backdrop-filter: blur(5px);
  }

  .container {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 92%;
    margin: auto;
    background-color: var(--screen-bg-color);
    border-radius: 5px;
    box-shadow:
      0 0 0 1px variables.$color-border,
      2px 4px 12px rgba(variables.$color-black, 0.22);

    @include mixins.desktop {
      width: calc(#{variables.$extension-width} - 32px);
    }

    .close-button {
      position: absolute;
      z-index: 3;
      right: 8px;
      top: 8px;
      color: variables.$color-white;

      &-icon {
        width: 100%;
      }
    }

    .header {
      flex-basis: 32px;
      flex-shrink: 0;
      color: variables.$color-white;
      font-size: 19px;
      line-height: 24px;
      font-weight: 500;
      word-break: break-word;
      text-align: center;
      display: flex;
      flex-direction: column;
      background-color: var(--screen-bg-color);

      &-icon {
        margin: 0 auto 10px;
        width: 48px;
        height: 48px;
      }

      &.transparent {
        background-color: transparent;
      }
    }

    .body {
      @extend %face-sans-15-regular;

      padding: var(--screen-padding-x);
      padding-top: 0;
      color: variables.$color-light-grey;
      word-break: break-word;
    }

    .footer {
      position: sticky;
      bottom: 0;
      margin: auto 0 0 0; // Move the footer to the bottom of the container
      display: flex;
      justify-content: center;
      gap: 10px;
      padding: 8px var(--screen-padding-x);
      background:
        linear-gradient(
          0deg,
          rgba(var(--screen-bg-color), 0.9) 50%,
          rgba(var(--screen-bg-color), 0) 100%
        );
    }
  }

  .node-connection-status {
    z-index: 2;
    display: flex;
    justify-content: center;
    align-items: center;
    color: variables.$color-dark-grey;

    @extend %face-sans-15-medium;

    @include mixins.desktop {
      border-radius: 0 0 10px 10px;
    }
  }

  .cover {
    position: fixed;
    z-index: -1;
    inset: 0;
  }

  &.full-screen {
    @include mixins.desktop {
      position: absolute;
    }

    .footer {
      padding-bottom: 25px;
    }

    .container {
      height: 100%;
      width: 100%;
    }
  }

  &.from-bottom {
    position: absolute;
    align-items: end;

    .header {
      position: sticky;
      z-index: 3;
      top: 0;
    }

    .container {
      width: 100%;
      max-height: 100%;
      margin-top: 0;
      margin-bottom: 0;
      overflow: hidden auto;
    }
  }

  &.dense {
    --screen-padding-x: 8px;
  }

  &.no-padding {
    --screen-padding-x: 0;
  }

  &.pop-in-transition {
    &-enter-active,
    &-leave-active {
      transition: opacity 0.3s;

      .container {
        transition: transform 0.3s;
      }
    }

    &-enter,
    &-leave-to {
      opacity: 0;

      .container {
        transform: scale(1.1);
      }
    }
  }

  &.from-bottom-transition {
    &-enter-active,
    &-leave-active {
      transition: opacity 0.3s;

      .container {
        transition: transform 0.3s cubic-bezier(0.65, 0, 0.35, 1);
      }
    }

    &-enter,
    &-leave-to {
      opacity: 0;

      .container {
        transform: translateY(70%);
      }
    }
  }
}
</style>
