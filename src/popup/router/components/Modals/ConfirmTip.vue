<template>
  <Modal
    has-close-button
    @close="resolve"
  >
    <template slot="header">
      {{ $t('modals.confirm-tip.title') }}
    </template>

    {{ $t('modals.confirm-tip.msg') }}
    <p class="confirmation--question">
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

.confirmation--question {
  font-weight: 500;
  color: variables.$color-white;
}
</style>
