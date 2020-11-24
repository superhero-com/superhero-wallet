<template>
  <Modal @close="resolve" close>
    <template slot="header">
      {{ $t('modals.confirm-tip.title') }}
    </template>
    <template slot="body">
      {{ $t('modals.confirm-tip.msg') }}
      <p class="confirmation--question">{{ $t('modals.confirm-tip.sub-message') }}</p>
    </template>
    <div slot="footer">
      <Button dark @click="cancelTip">
        {{ $t('modals.cancel') }}
      </Button>
      <Button data-cy="to-confirm" @click="toConfirm">
        {{ $t('modals.confirm-tip.send') }}
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
  },
  components: { Modal, Button },
  methods: {
    toConfirm() {
      this.resolve(true);
    },
    cancelTip() {
      this.reject(new Error('Rejected by user'));
    },
  },
};
</script>

<style lang="scss" scoped>
.confirmation--question {
  font-weight: 500 !important;
  color: #fff !important;
}
</style>
