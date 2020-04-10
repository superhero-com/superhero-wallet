<template>
  <Modal @close="resolve">
    <h4 class="confirmtip-modal-header" slot="header">
      {{ $t('pages.tipPage.sendTipConfirmationHeader') }}
    </h4>
    <div class="confirmtip-modal--body" slot="body">
      {{ $t('pages.tipPage.sendTipConfirmationBody') }}
      <p class="confirmation--question">{{ $t('pages.tipPage.sendTipConfirmationQstn') }}</p>
    </div>
    <div class="confirmtip-modal--footer" slot="footer">
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
.confirmtip-modal-header {
  margin: 0 !important;
  font-weight: 500 !important;
}
.confirmtip-modal--body {
  padding-bottom: 20px;
  .confirmation--question {
    font-weight: 500 !important;
    color: #fff !important;
  }
}
.confirmtip-modal--footer {
  display: flex;
  justify-content: space-between;
  button {
    margin: 0 !important;
    width: 120px !important;
    font-weight: 700 !important;
    font-size: 15px !important;
  }
}
</style>
