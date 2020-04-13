<template>
  <Modal @close="resolve">
    <div slot="body">
      <CheckIcon /> <br />
      <b>{{ $t('pages.claim.url') }}:</b> {{ url }} <br />
      <b>{{ $t('pages.claim.tipsOnUrl') }}:</b> {{ claimAmount }} {{ $t('pages.claim.ae') }} <br />
      <span style="color: #2a9cff;">{{ $t('pages.claim.claimed') }}</span>
    </div>
    <div slot="footer">
      <Button @click="resolve">OK</Button>
    </div>
  </Modal>
</template>

<script>
import Modal from '../Modal';
import Button from '../Button';
import CheckIcon from '../../../../icons/check-icon.svg?vue-component';

export default {
  props: {
    resolve: { type: Function, required: true },
    url: { type: String, required: true },
    claimAmount: { type: Number, required: true },
  },
  components: { Modal, Button, CheckIcon },
};
</script>
