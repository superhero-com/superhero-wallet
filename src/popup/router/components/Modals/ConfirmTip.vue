<template>
  <Modal
    has-close-button
    @close="resolve"
  >
    <h2 class="text-heading-2 text-center confirmation-title">
      {{ $t('modals.confirm-tip.title') }}
    </h2>

    <p>{{ $t('modals.confirm-tip.msg') }}</p>
    <p class="confirmation-question">
      {{ $t('modals.confirm-tip.sub-message') }}
    </p>

    <template slot="footer">
      <Button
        fill="secondary"
        @click="cancelTip"
      >
        {{ $t('modals.cancel') }}
      </Button>
      <Button
        data-cy="to-confirm"
        @click="toConfirm"
      >
        {{ $t('modals.confirm-tip.send') }}
      </Button>
    </template>
  </Modal>
</template>

<script>
import Modal from '../Modal.vue';
import Button from '../Button.vue';

export default {
  components: { Modal, Button },
  props: {
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
  },
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
@use "../../../../styles/variables";

.confirmation {
  &-title {
    margin-bottom: 20px;
  }

  &-question {
    font-weight: 500;
    color: variables.$color-white;
  }
}
</style>
