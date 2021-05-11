<template>
  <Modal
    close
    @close="resolve"
  >
    <template slot="header">
      <UrlStatus
        :status="status"
        modal
      />
      {{ content.title }}
    </template>

    {{ content.msg }}

    <Button
      slot="footer"
      class="ok-button"
      @click="resolve"
    >
      {{ $t('ok') }}
    </Button>
  </Modal>
</template>

<script>
import Modal from '../Modal';
import Button from '../Button';
import UrlStatus from '../UrlStatus';

export default {
  components: { Modal, Button, UrlStatus },
  props: {
    resolve: { type: Function, required: true },
    status: { type: String, required: true },
  },
  computed: {
    content() {
      switch (this.status) {
        case 'verified':
          return this.$t('modals.verified');
        case 'not-verified':
          return this.$t('modals.not-verified');
        case 'blacklisted':
          return this.$t('modals.blacklisted');
        case 'not-secure':
          return this.$t('modals.not-secure');
        default:
          throw new Error(`Unknown url status: ${this.status}`);
      }
    },
  },
};
</script>
