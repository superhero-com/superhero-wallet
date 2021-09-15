<template>
  <Modal
    close
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
      {{ $t('ok') }}
    </Button>
  </Modal>
</template>

<script>
import Modal from '../Modal';
import Button from '../Button';
import StatusIcon from '../StatusIcon';

export default {
  components: { Modal, Button, StatusIcon },
  props: {
    resolve: { type: Function, required: true },
    close: { type: Function, default: null },
    title: { type: String, default: '' },
    msg: { type: String, default: '' },
    type: { type: String, default: '' },
    icon: { type: String, default: '' },
  },
};
</script>
