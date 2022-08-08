<template>
  <transition appear>
    <div
      class="modal"
      :class="{'full-screen': fullScreen}"
    >
      <div class="container">
        <ButtonPlain
          v-if="close"
          class="close"
          @click="$emit('close')"
        >
          <Close />
        </ButtonPlain>
        <div
          v-if="$slots.header"
          class="header"
        >
          <slot name="header" />
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
import ButtonPlain from './ButtonPlain.vue';
import Close from '../../../icons/close.svg?vue-component';
import NodeConnectionStatus from './NodeConnectionStatus.vue';

export default {
  components: { ButtonPlain, Close, NodeConnectionStatus },
  props: {
    close: Boolean,
    fullScreen: Boolean,
  },
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

  .container {
    position: relative;
    width: 92%;
    margin: auto;
    padding: 14px 28px 40px;
    background: variables.$color-bg-1;
    border: 1px solid variables.$color-border;
    border-radius: 5px;
    box-shadow: 2px 4px 12px rgba(variables.$color-black, 0.22);

    @include mixins.desktop {
      width: calc(#{variables.$extension-width} - 32px);
    }

    .close {
      width: 24px;
      height: 24px;
      position: absolute;
      right: 8px;
      top: 8px;
      color: variables.$color-white;

      svg {
        width: 24px;
      }
    }

    .header {
      color: variables.$color-white;
      font-size: 19px;
      line-height: 24px;
      font-weight: 500;
      margin-bottom: 24px;
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
      margin-bottom: 40px;
    }

    .footer .content {
      display: flex;
      justify-content: center;

      ::v-deep .button {
        margin: 0 10px;
        width: 120px;
        font-weight: 700;
      }
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

  &.v-enter-active,
  &.v-leave-active {
    transition: opacity 0.3s;

    .container {
      transition: transform 0.3s;
    }
  }

  &.v-enter,
  &.v-leave-to {
    opacity: 0;

    .container {
      transform: scale(1.1);
    }
  }
}
</style>
