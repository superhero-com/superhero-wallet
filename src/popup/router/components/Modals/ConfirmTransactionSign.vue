<template>
  <Modal class="confirm-tx-sign-modal">
    <div slot="header" class="identicons-holder">
      <div class="from">
        <UserAvatar :address="account.publicKey" :name="account.name" />
        <span class="account-address">{{ activeAccountName }}</span>
      </div>
      <div class="arrow-separator">
        <ae-icon name="left-more" />
      </div>
      <div class="to" v-if="!showAddress">
        <UserAvatar :address="receiver" />
        <ae-address
          :value="receiver"
          v-if="receiver"
          length="short"
          class="account-address"
          data-cy="address-receiver"
        />
        <span v-else class="account-address">
          {{ $t('modals.confirm-transaction-sign.unknown') }}
        </span>
      </div>
      <div v-else class="to">
        <ae-icon name="square" />
        <span class="account-address">
          {{
            txType === 'contractCreateTx'
              ? $t('modals.confirm-transaction-sign.contract-create')
              : $t('modals.confirm-transaction-sign.aens')
          }}
        </span>
      </div>
    </div>
    <template slot="body">
      <li>
        <ae-badge>{{ txType }}</ae-badge>
      </li>
      <DetailsItem :label="$t('pages.signTransaction.fee')">
        <div class="balance no-sign">{{ toAe(transaction.fee) }} {{ $t('pages.appVUE.aeid') }}</div>
      </DetailsItem>

      <DetailsItem :label="$t('pages.signTransaction.total')">
        <div class="balance balanceTotalSpend no-sign">
          {{ totalSpend }} {{ $t('pages.appVUE.aeid') }}
        </div>
      </DetailsItem>

      <template v-for="field in TX_FIELDS">
        <DetailsItem
          v-if="transaction[field]"
          :key="field"
          :label="$t('modals.confirm-transaction-sign')[field]"
          direction="column"
        >
          <div>
            {{ transaction[field] }}
          </div>
        </DetailsItem>
      </template>
    </template>

    <div class="modal-confirm-btns" slot="footer">
      <Button dark @click="cancel">{{ $t('modals.cancel') }}</Button>
      <Button @click="confirm">{{ $t('modals.confirm') }}</Button>
    </div>
  </Modal>
</template>

<script>
import { mapGetters } from 'vuex';
import { OBJECT_ID_TX_TYPE, TX_TYPE } from '@aeternity/aepp-sdk/es/tx/builder/schema';
import { aettosToAe } from '../../../utils/helper';
import Modal from '../Modal';
import Button from '../Button';
import UserAvatar from '../UserAvatar';
import DetailsItem from '../DetailsItem';

export default {
  props: {
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
    transaction: { type: Object, required: true },
  },
  components: { Modal, Button, UserAvatar, DetailsItem },
  data: () => ({
    TX_FIELDS: [
      'payload',
      'recipientId',
      'code',
      'callData',
      'contractId',
      'commitmentId',
      'name',
      'nameFee',
      'nameSalt',
      'nameId',
      'pointers',
    ],
  }),
  computed: {
    ...mapGetters(['account', 'activeAccountName']),
    receiver() {
      return this.transaction.contractId || this.transaction.recipientId || '';
    },
    showAddress() {
      return [
        TX_TYPE.contractCreate,
        TX_TYPE.namePreClaim,
        TX_TYPE.nameClaim,
        TX_TYPE.nameUpdate,
      ].includes(this.txType);
    },
    txType() {
      return OBJECT_ID_TX_TYPE[this.transaction.tag];
    },
    totalSpend() {
      const amount = this.transaction.amount || 0;
      return (parseFloat(amount) + parseFloat(aettosToAe(this.transaction.fee))).toFixed(7);
    },
  },
  methods: {
    toAe(balance) {
      return parseFloat(aettosToAe(balance)).toFixed(7);
    },
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
