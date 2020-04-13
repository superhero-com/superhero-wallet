<template>
  <Modal @close="resolve" class="default-modal">
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

<style lang="scss">
.default-modal {
  button {
    width: 120px !important;
    font-weight: bold !important;
  }

  .modal--mask {
    .modal--body {
      text-align: center;
    }
  }
}
</style>
