<template>
  <Modal @close="cancel" close>
    <template v-if="title" slot="header">{{ title }}</template>
    <template v-if="msg">{{ msg }}</template>
    <template slot="footer">
      <Button dark @click="cancel">
        {{ $t('modals.cancel') }}
      </Button>
      <Button data-cy="to-confirm" @click="resolve">
        {{ $t('modals.confirm') }}
      </Button>
    </template>
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
    cancel() {
      this.reject(new Error('Rejected by user'));
    },
  },
};
</script>
