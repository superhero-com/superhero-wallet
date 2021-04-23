<template>
  <transition appear>
    <div
      class="modal"
      :class="{'full-screen': fullScreen}"
    >
      <div class="container">
        <button
          v-if="close"
          class="close"
          @click="$emit('close')"
        >
          <Close />
        </button>
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
          <slot name="footer" />
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import Close from '../../../icons/close.svg?vue-component';

export default {
  components: { Close },
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
@use '../../../styles/mixins';

.modal {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(variables.$color-black, 0.7);
  display: flex;

  .container {
    position: relative;
    width: 87%;
    margin: auto;
    padding: 62px 25px 30px;
    background: variables.$color-bg-1;
    border: 1px solid variables.$color-border;
    border-radius: 5px;

    .close {
      position: absolute;
      right: 10px;
      top: 10px;
      // TODO: Extract to ButtonPlain
      background: none;
      border: none;
      outline: none;
      padding: 0;
    }

    .header {
      color: variables.$color-white;
      font-size: 17px;
      font-weight: 500;
      margin-bottom: 25px;
      word-break: break-word;
      text-align: center;
    }

    .body {
      margin-bottom: 40px;
      color: variables.$color-white;
      font-size: 14px;
      word-break: break-word;
      text-align: center;
    }

    .footer {
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
      padding: 24px 0;

      @include mixins.desktop {
        border-radius: 0 0 10px 10px;
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
