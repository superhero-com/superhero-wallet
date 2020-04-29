<template>
  <Modal @close="resolve">
    <template slot="header">
      <UrlStatus :status="status" modal />
      {{ content.title }}
    </template>
    <div slot="body">{{ content.msg }}</div>
    <div slot="footer">
      <Button class="ok-button" @click="resolve">{{ $t('modals.ok') }}</Button>
    </div>
  </Modal>
</template>

<script>
import Modal from '../Modal';
import Button from '../Button';
import UrlStatus from '../UrlStatus';

export default {
  props: {
    resolve: { type: Function, required: true },
    status: { type: String, required: true },
  },
  components: { Modal, Button, UrlStatus },
  computed: {
    content() {
      switch (this.status) {
        case 'verified':
          return this.$t('modals.verified');
        case 'not-verified':
          return this.$t('modals.not-verified');
        case 'blacklisted':
          return this.$t('modals.blacklisted');
        default:
          throw new Error(`Unknown url status: ${this.status}`);
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
