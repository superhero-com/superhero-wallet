<template>
  <Modal @close="resolve">
    <div class="badge-modal-header" slot="header">
      <UrlBadge :type="verifiedStatus" />
    </div>
    <div slot="body">
      <h4>
        {{
          verifiedStatus == 'verified'
            ? $t('pages.tipPage.whatIsVerifieddUrl')
            : $t('pages.tipPage.whatIsNotVerifiedUrl')
        }}
      </h4>
      {{
        verifiedStatus == 'verified'
          ? $t('pages.tipPage.verifiedUrlInfo')
          : $t('pages.tipPage.notVerifiedUrlInfo')
      }}
    </div>
    <div slot="footer">
      <Button class="ok-button" @click="resolve">{{ $t('pages.tipPage.OkButton') }}</Button>
    </div>
  </Modal>
</template>

<script>
import Modal from '../Modal';
import Button from '../Button';
import UrlBadge from '../UrlBadge';

export default {
  props: {
    resolve: { type: Function, required: true },
    verifiedStatus: { type: String, required: true },
  },
  components: { Modal, Button, UrlBadge },
};
</script>

<style lang="scss" scoped>
.badge-modal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  .badge {
    font-weight: 400 !important;
    margin: 0 !important;
  }
  h4 {
    margin: 0 5px;
  }
}
.ok-button {
  width: 120px !important;
  font-weight: 700 !important;
  font-size: 15px !important;
}
</style>
