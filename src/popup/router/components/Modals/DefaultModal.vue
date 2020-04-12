<template>
  <Modal @close="resolve">
    <div v-if="title" slot="header">{{ title || $t(`modals.${type}.title`) }}</div>
    <div slot="body">{{ msg || $t(`modals.${type}.msg`) }}</div>
    <div slot="footer">
      <Button @click="resolve">OK</Button>
    </div>
  </Modal>
</template>

<script>
import Modal from '../Modal';
import Button from '../Button';

export default {
  props: {
    resolve: { type: Function, required: true },
    title: { type: String, required: false },
    msg: { type: String, required: false },
    type: { type: String, required: false },
  },
  components: { Modal, Button },
};
</script>
