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
  computed: {
    content() {
      switch (this.status) {
      case 'verified': return this.$i18n('modals.verified');
      case 'not-supported': return this.$i18n('modals.not-supported');
      case 'blacklisted': return this.$i18n('modals.blacklisted');
      default: throw new Error(`Unknown url status: ${this.status}`);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.ok-button {
  width: 120px !important;
}
</style>
