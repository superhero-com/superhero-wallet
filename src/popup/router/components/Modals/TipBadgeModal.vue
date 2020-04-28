<template>
  <Modal @close="resolve">
    <template slot="header">
      {{ content.title }}      
    </template>
    <div slot="body">
      {{ content.msg }}
    </div>
    <div slot="footer">
      <Button class="ok-button" @click="resolve">{{ $t('modals.ok') }}</Button>
    </div>
  </Modal>
</template>

<script>
import Modal from '../Modal';
import Button from '../Button';

export default {
  props: {
    resolve: { type: Function, required: true },
    status: { type: String, required: true },
  },
  components: { Modal, Button },
};
</script>

<style lang="scss" scoped>
.ok-button {
  width: 120px !important;
}
</style>
