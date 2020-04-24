<template>
  <Modal @close="resolve">
    <template slot="header">
      {{ $t('pages.tipPage.sendTipConfirmationHeader') }}
    </template>
    <template slot="body">
      {{ $t('pages.tipPage.sendTipConfirmationBody') }}
      <p class="confirmation--question">{{ $t('pages.tipPage.sendTipConfirmationQstn') }}</p>
    </template>
    <div class="modal-confirm-btns" slot="footer">
      <Button data-cy="cancel-tip" dark @click="cancelTip">
        {{ $t('pages.tipPage.cancel') }}
      </Button>
      <Button data-cy="to-confirm" @click="toConfirm">
        {{ $t('pages.tipPage.sendTipBtn') }}
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
      this.reject(new Error('reject'));
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
