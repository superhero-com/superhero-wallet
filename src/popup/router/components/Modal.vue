<template>
  <transition appear>
    <div class="modal">
      <div class="container">
        <button v-if="close" class="close" @click="$emit('close')">
          <Close />
        </button>
        <div v-if="$slots.header" class="header">
          <slot name="header" />
        </div>
        <div v-if="$slots.default" class="body">
          <slot />
        </div>
        <div v-if="$slots.footer" class="footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import Close from '../../../icons/close.svg?vue-component';

export default {
  props: { close: Boolean },
  components: { Close },
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
@import '../../../styles/variables';

.modal {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;

  .container {
    position: relative;
    width: 87%;
    margin: auto;
    padding: 62px 25px 30px;
    background: $modal-background;
    border: 1px solid $tx-border-color;
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
      color: $white-color;
      font-size: 17px;
      font-weight: 500;
      margin-bottom: 25px;
      word-break: break-word;
      text-align: center;
    }

    .body {
      margin-bottom: 40px;
      color: $text-color;
      font-size: 14px;
      word-break: break-word;
      text-align: center;
    }

    .footer {
      display: flex;
      justify-content: center;

      ::v-deep .primary-button {
        margin: 0 10px;
        width: 120px;
        font-weight: 700;
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
