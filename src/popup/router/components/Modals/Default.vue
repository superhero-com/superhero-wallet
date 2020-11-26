<template>
  <Modal @close="resolve" class="default" close>
    <template v-if="title" slot="header">{{ title }}</template>
    {{ msg || $t(`modals.${type}.msg`) }}
    <Button slot="footer" @click="resolve">{{ $t('ok') }}</Button>
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
