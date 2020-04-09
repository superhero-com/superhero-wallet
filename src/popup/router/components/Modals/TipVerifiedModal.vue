<template>
  <Modal>
    <div slot="body">
      <span style="display:block;margin-bottom:1rem;">
        <CheckIcon />
        This URL has been verified.
      </span>
      This means that the creator of the content there or the website owner has successfully claimed
      tips for this url.
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
  },
  components: { Modal, Button, CheckIcon },
};
</script>
