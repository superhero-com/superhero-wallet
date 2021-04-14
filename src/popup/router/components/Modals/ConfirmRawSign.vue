<template>
  <Modal
    full-screen
    class="confirm-raw-sign"
  >
    <h3>
      {{ $t('modals.confirm-transaction-sign.sign-raw') }} <br>
      <span class="name-holder">
        <Avatar
          :address="account.address"
          :name="account.name"
          size="small"
        />
        {{ account.name || account.address }}
      </span>
    </h3>
    <DetailsItem
      :label="$t('modals.confirm-transaction-sign.data-sign')"
      direction="column"
    >
      <div>{{ dataAsString }}</div>
    </DetailsItem>

    <template slot="footer">
      <Button
        third
        dark
        @click="cancel"
      >
        {{ $t('modals.cancel') }}
      </Button>
      <Button
        third
        @click="confirm"
      >
        {{ $t('modals.confirm') }}
      </Button>
    </template>
  </Modal>
</template>

<script>
import { mapGetters } from 'vuex';
import Modal from '../Modal';
import Button from '../Button';
import Avatar from '../Avatar';
import DetailsItem from '../DetailsItemOld';

export default {
  components: {
    Modal, Button, Avatar, DetailsItem,
  },
  props: {
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
    data: { type: [String, Uint8Array], required: true },
  },
  computed: {
    ...mapGetters(['account']),
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

<style lang="scss" scoped>
.confirm-raw-sign {
  .name-holder {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
