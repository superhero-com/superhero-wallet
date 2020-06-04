<template>
  <transition name="modal">
    <div class="modal--mask">
      <div class="modal--wrapper">
        <div class="modal--container">
          <Close v-if="close" class="modal--close" @click="$emit('close')" />
          <div v-if="$slots.header" class="modal--header">
            <slot name="header" />
          </div>
          <div v-if="$slots.body" class="modal--body">
            <slot name="body" />
          </div>
          <div v-if="$slots.footer" class="modal--footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import Close from '../../../icons/close.svg?vue-component';

export default {
  props: {
    close: { type: Boolean, default: true },
  },
  components: {
    Close,
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

<style lang="scss">
@import '../../../common/variables';

.modal--mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: table;
  transition: opacity 0.3s ease;

  .modal--wrapper {
    display: table-cell;
    vertical-align: middle;
  }

  .modal--container {
    position: relative;
    width: 87%;
    margin: 0 auto;
    padding: 62px 25px 30px;
    background: $modal-background;
    border: 1px solid $tx-border-color;
    border-radius: 5px;
    transition: all 0.3s ease;
  }

  .modal--close {
    position: absolute;
    right: 10px;
    top: 10px;
    cursor: pointer;
  }

  .modal--header {
    color: $white-color;
    font-size: 17px;
    font-weight: 500;
    margin-bottom: 25px;
    word-break: break-word;
    text-align: center;
  }

  .modal--body {
    margin-bottom: 40px;
    color: $text-color;
    font-size: 14px;
    word-break: break-word;
    text-align: center;
  }

  .modal--footer {
    .modal-confirm-btns {
      display: flex;
      justify-content: center;

      button {
        margin: 0 10px !important;
        width: 120px !important;
        font-weight: 700 !important;
      }
    }
  }

  .modal--enter,
  .modal--leave--active {
    opacity: 0;
  }

  .modal--enter .modal--container,
  .modal--leave--active .modal--container {
    -webkit-transform: scale(1.1);
    transform: scale(1.1);
  }
}
</style>
