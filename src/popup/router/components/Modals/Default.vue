<template>
  <Modal
    :class="{
      'text-center': textCenter
    }"
    has-close-button
    v-on="{ close: close || resolve }"
  >
    <div class="icon-wrapper">
      <StatusIcon
        :status="icon"
        class="icon"
      />
    </div>

    <h2 class="text-heading-2 text-center">
      {{ title }}
    </h2>

    <slot name="msg">
      {{ msg }}
    </slot>

    <slot />

    <slot
      v-if="$slots.footer"
      slot="footer"
      name="footer"
    />
    <Button
      v-else
      slot="footer"
      :class="{ 'center-button': textCenter }"
      @click="resolve"
    >
      {{ buttonMessage || $t('ok') }}
    </Button>
  </Modal>
</template>

<script>
import Modal from '../Modal.vue';
import Button from '../Button.vue';
import StatusIcon from '../StatusIcon.vue';

export default {
  components: { Modal, Button, StatusIcon },
  props: {
    resolve: { type: Function, required: true },
    close: { type: Function, default: null },
    title: { type: String, default: '' },
    msg: { type: String, default: '' },
    type: { type: String, default: '' },
    icon: { type: String, default: '' },
    buttonMessage: { type: String, default: '' },
    textCenter: Boolean,
  },
};
</script>

<style lang="scss" scoped>

  .modal {
    &.text-center {
      text-align: center;
    }

    .icon-wrapper {
      text-align: center;

      .icon {
        width: 40px;
        height: 40px;
        margin: 0 auto;
        text-align: center;
      }
    }

    .center-button {
      width: auto;
      padding: 0 24px;
    }
  }
</style>
