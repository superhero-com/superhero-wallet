<template>
  <Modal class="confirm-tx-sign-modal">
    <SignAccountIdenticons :transaction="tx" slot="header" />

    <SignDetailsList :transaction="tx" />

    <template slot="footer">
      <Button dark @click="cancel">{{ $t('modals.cancel') }}</Button>
      <Button @click="confirm">{{ $t('modals.confirm') }}</Button>
    </template>
  </Modal>
</template>

<script>
import { OBJECT_ID_TX_TYPE } from '@aeternity/aepp-sdk/es/tx/builder/schema';
import Modal from '../Modal';
import Button from '../Button';
import SignAccountIdenticons from '../SignAccountIdenticons';
import SignDetailsList from '../SignDetailsList';

export default {
  props: {
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
    transaction: { type: Object, required: true },
  },
  components: { Modal, Button, SignAccountIdenticons, SignDetailsList },
  computed: {
    totalSpend() {
      const amount = this.transaction.amount || 0;
      return (parseFloat(amount) + parseFloat(+this.transaction.fee)).toFixed(7);
    },
    tx() {
      return {
        ...this.transaction,
        txType: OBJECT_ID_TX_TYPE[this.transaction.tag],
        total: this.totalSpend,
      };
    },
  },
  methods: {
    confirm() {
      this.resolve(this.transaction.fee);
    },
    cancel() {
      this.reject(new Error('Rejected by user'));
    },
  },
};
</script>

<style lang="scss" src="./SignModal.scss" />
