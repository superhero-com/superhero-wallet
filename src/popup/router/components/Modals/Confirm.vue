<template>
  <Modal
    close
    @close="cancel"
  >
    <template
      v-if="title"
      slot="header"
    >
      {{ title }}
    </template>
    <template v-if="msg">
      {{ msg }}
    </template>
    <template slot="footer">
      <Button
        fill="secondary"
        @click="cancel"
      >
        {{ $t('modals.cancel') }}
      </Button>
      <Button
        data-cy="to-confirm"
        @click="resolve"
      >
        {{ $t('modals.confirm') }}
      </Button>
    </template>
  </Modal>
</template>

<script>
import Modal from '../Modal';
import Button from '../Button';

export default {
  components: { Modal, Button },
  props: {
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
    title: { type: String, required: false },
    msg: { type: String, required: false },
  },
  methods: {
    cancel() {
      this.reject(new Error('Rejected by user'));
    },
  },
};
</script>
