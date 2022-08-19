<template>
  <transition
    appear
    :name="fromBottom ? 'from-bottom-transition' : 'pop-in-transition'"
  >
    <div
      class="modal"
      :class="{
        'full-screen': fullScreen,
        'from-bottom': fromBottom,
        'has-close-button': hasCloseButton,
      }"
    >
      <div
        v-click-outside="() => $emit('close')"
        class="container"
      >
        <ButtonIcon
          v-if="hasCloseButton"
          class="close-button"
          @click="$emit('close')"
        >
          <Close />
        </ButtonIcon>
        <div
          v-if="$slots.header || header"
          class="header"
        >
          <slot name="header">
            <div class="header-default-text">
              {{ header }}
            </div>
            <slot name="header-after" />
          </slot>
        </div>

        <div
          v-if="$slots.default"
          class="body"
        >
          <slot />
        </div>

        <div
          v-if="$slots.footer"
          class="footer"
        >
          <div class="content">
            <slot name="footer" />
          </div>
          <NodeConnectionStatus v-if="fullScreen" />
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { clickOutside } from '../../directives';
import ButtonIcon from './ButtonIcon.vue';
import Close from '../../../icons/close.svg?vue-component';
import NodeConnectionStatus from './NodeConnectionStatus.vue';

export default {
  components: {
    ButtonIcon,
    Close,
    NodeConnectionStatus,
  },
  directives: {
    'click-outside': clickOutside,
  },
  props: {
    hasCloseButton: Boolean,
    fullScreen: Boolean,
    fromBottom: Boolean,
    header: { type: String, default: null },
  },
  emits: [
    'close',
  ],
  mounted() {
    if (document.body.style.overflow) return;
    document.body.style.overflow = 'hidden';
    this.$once('hook:destroyed', () => {
      document.body.style.overflow = '';
    });
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.modal {
  position: fixed;
  z-index: 2;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  min-width: variables.$extension-width;
  background-color: rgba(variables.$color-black, 0.7);
  display: flex;
  backdrop-filter: blur(5px);

  .container {
    position: relative;
    width: 92%;
    margin: auto;
    padding: 24px;
    background: variables.$color-bg-1;
    border-radius: 5px;
    box-shadow:
      0 0 0 1px variables.$color-border,
      2px 4px 12px rgba(variables.$color-black, 0.22);

    @include mixins.desktop {
      width: calc(#{variables.$extension-width} - 32px);
    }

    .close-button {
      position: absolute;
      right: 2px;
      top: 2px;
      color: variables.$color-white;

      &-icon {
        width: 100%;
      }
    }

    .header {
      color: variables.$color-white;
      font-size: 19px;
      line-height: 24px;
      font-weight: 500;
      margin-bottom: 8px;
      word-break: break-word;
      text-align: center;
      display: flex;
      flex-direction: column;

      ::v-deep .icon {
        width: 48px;
        height: 48px;
        align-self: center;
        margin-bottom: 16px;
      }
    }

    .body {
      @extend %face-sans-15-regular;

      color: variables.$color-light-grey;
      word-break: break-word;
      text-align: center;
    }

    .footer .content {
      display: flex;
      justify-content: center;
      margin-top: 40px;

      ::v-deep .button {
        margin: 0 10px;
        width: 120px;
        font-weight: 700;
      }
    }
  }

  &.has-close-button {
    .container {
      padding-top: 40px;
    }
  }

  &.full-screen .container {
    width: 100%;
    height: 100%;
    padding: 0;
    padding-top: env(safe-area-inset-top);
    border: none;
    border-radius: 0;
    display: flex;
    flex-direction: column;

    @include mixins.desktop {
      width: variables.$extension-width;
      height: 600px;
      border-radius: 10px;
      box-shadow: variables.$color-border 0 0 0 1px;
    }

    .body {
      height: 100%;
      margin-bottom: 0;
      overflow-y: scroll;
    }

    .footer {
      position: sticky;
      bottom: 0;
      width: 100%;
      display: flex;
      flex-direction: column;

      @include mixins.desktop {
        border-radius: 0 0 10px 10px;
      }

      .content {
        padding: 24px 0;
      }

      .node-connection-status {
        position: static;
        height: calc(40px + env(safe-area-inset-bottom));
        margin-top: 4px;
        padding-bottom: env(safe-area-inset-bottom);
        display: flex;
        justify-content: center;
        align-items: center;
        color: variables.$color-dark-grey;

        @extend %face-sans-15-medium;

        @include mixins.desktop {
          border-radius: 0 0 10px 10px;
        }
      }
    }
  }

  &.from-bottom {
    position: absolute;
    align-items: end;

    .container {
      width: 100%;
      max-height: 100%;
      margin-top: 0;
      margin-bottom: 0;
    }
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
      transition: opacity 0.3s ease-in-out;

      .container {
        transition: transform 0.3s ease-in-out;
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
