<template>
  <Modal class="confirm-tx-sign-modal" data-cy="popup-aex2">
    <SignAccountIdenticons v-bind="transaction" slot="header" />

    <SignDetailsList :transaction="transaction" />

    <template slot="footer">
      <Button dark @click="cancel()" data-cy="deny">
        {{ $t('pages.signTransaction.reject') }}
      </Button>
      <Button @click="resolve()" data-cy="accept">
        {{ $t('pages.signTransaction.confirm') }}
      </Button>
    </template>
  </Modal>
</template>

<script>
import Modal from '../Modal';
import Button from '../Button';
import SignAccountIdenticons from '../SignAccountIdenticons';
import SignDetailsList from '../SignDetailsList';
import mixin from '../../pages/Popups/mixin';

export default {
  mixins: [mixin],
  components: { Modal, Button, SignAccountIdenticons, SignDetailsList },
  props: {
    transaction: { type: Object, required: true },
  },
};
</script>

<style lang="scss" src="./SignModal.scss" />
