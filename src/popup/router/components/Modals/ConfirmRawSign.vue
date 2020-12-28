<template>
  <Modal class="confirm-tx-sign-modal">
    <h3>
      {{ $t('modals.confirm-transaction-sign.sign-raw') }} <br />
      <span class="name-holder">
        <Avatar :address="account.publicKey" :name="account.name" size="small" />
        {{ account.name || account.publicKey }}
      </span>
    </h3>
    <DetailsItem :label="$t('modals.confirm-transaction-sign.data-sign')" direction="column">
      <div>{{ dataAsString }}</div>
    </DetailsItem>

    <template slot="footer">
      <Button dark @click="cancel">{{ $t('modals.cancel') }}</Button>
      <Button @click="confirm">{{ $t('modals.confirm') }}</Button>
    </template>
  </Modal>
</template>

<script>
import { mapGetters } from 'vuex';
import Modal from '../Modal';
import Button from '../Button';
import Avatar from '../Avatar';
import DetailsItem from '../DetailsItem';

export default {
  props: {
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
    data: { type: [String, Uint8Array], required: true },
  },
  components: { Modal, Button, Avatar, DetailsItem },
  computed: {
    ...mapGetters(['account', 'activeAccountName']),
    dataAsString() {
      if (typeof this.data === 'string') return this.data;
      return Buffer.from(this.data).toString('hex');
    },
  },
  methods: {
    confirm() {
      this.resolve();
    },
    cancel() {
      this.reject(new Error('Rejected by user'));
    },
  },
};
</script>

<style lang="scss" src="./SignModal.scss" />
