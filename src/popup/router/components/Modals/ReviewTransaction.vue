<template>
  <Modal
    full-screen
    close
  >
    <!--    <TransferReview-->
    <!--      v-bind="$props"-->
    <!--    />-->
    <ReviewTip
      v-bind="$props"
      tip-url="https://medium.com/@johndoe/æternitys-mainn
et-turns-one-587223024cc6"
    />
  </Modal>
</template>

<script>
import Modal from '../Modal.vue';
import ReviewTip from '../ReviewTip.vue';

// TODO - pawel remove

export default {
  components: {
    ReviewTip,
    Modal,
  },
  props: {
    selectedToken: { type: Object, default: null },
    amount: { type: String, default: null },
    fee: { type: Object, default: null },
    total: { type: Number, default: null },
  },
};
</script>
