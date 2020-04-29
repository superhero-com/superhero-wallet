<template>
  <Modal @close="resolve">
    <template v-if="title" slot="header">{{ title }}</template>
    <template v-if="msg" slot="body"> {{ msg }} </template>
    <div class="modal-confirm-btns" slot="footer">
      <Button data-cy="cancel-tip" dark @click="cancel">
        {{ $t('modals.cancel') }}
      </Button>
      <Button data-cy="to-confirm" @click="confirm">
        {{ $t('modals.confirm') }}
      </Button>
    </div>
  </Modal>
</template>

<script>
import Modal from '../Modal';
import Button from '../Button';

export default {
  props: {
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
    title: { type: String, required: false },
    msg: { type: String, required: false },
  },
  components: { Modal, Button },
  methods: {
    confirm() {
      this.resolve(true);
    },
    cancel() {
      this.reject(new Error('reject'));
    },
  },
};
</script>
