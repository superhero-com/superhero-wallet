<template>
  <Modal
    class="confirm-tx-sign-modal"
    data-cy="popup-aex2"
  >
    <SignAccountIdenticons
      v-bind="transaction"
      slot="header"
    />

    <SignDetailsList :transaction="transaction" />

    <template slot="footer">
      <Button
        dark
        data-cy="deny"
        @click="cancel()"
      >
        {{ $t('pages.signTransaction.reject') }}
      </Button>
      <Button
        data-cy="accept"
        @click="resolve()"
      >
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
  components: {
    Modal, Button, SignAccountIdenticons, SignDetailsList,
  },
  mixins: [mixin],
  props: {
    transaction: { type: Object, required: true },
  },
};
</script>

<style lang="scss" src="./SignModal.scss" />
