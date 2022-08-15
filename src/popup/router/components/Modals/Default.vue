<template>
  <Modal
    has-close-button
    v-on="{ close: close || resolve }"
  >
    <template slot="header">
      <StatusIcon
        v-if="icon"
        :status="icon"
        class="icon"
      />
      {{ title }}
    </template>

    <slot
      v-if="$slots.msg"
      name="msg"
    />
    <template v-else>
      {{ msg }}
    </template>

    <slot />

    <slot
      v-if="$slots.footer"
      slot="footer"
      name="footer"
    />
    <Button
      v-else
      slot="footer"
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
  },
};
</script>
