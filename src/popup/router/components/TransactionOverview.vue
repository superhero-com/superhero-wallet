<template>
  <Overview
    class="transaction-overview"
    :title="transaction.title"
    :sender="transaction.sender"
    :recipient="transaction.recipient"
  />
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import { SCHEMA } from '@aeternity/aepp-sdk';
import Overview from './Overview';

export default {
  components: { Overview },
  props: {
    tx: { type: Object, required: true },
  },
  computed: {
    ...mapGetters(['getTxType', 'getTxDirection', 'getExplorerPath']),
    ...mapGetters('names', ['getPreferred']),
    ...mapState({
      account(_, { account }) {
        return {
          ...account,
          label: this.$t('transaction.overview.accountAddress'),
          url: this.getExplorerPath(account.address),
        };
      },
    }),
    transaction() {
      switch (this.txType) {
        case SCHEMA.TX_TYPE.spend:
          return {
            sender: {
              address: this.tx.senderId,
              name: this.getPreferred(this.tx.senderId),
              url: this.getExplorerPath(this.tx.senderId),
              label: this.$t('transaction.overview.accountAddress'),
            },
            recipient: {
              address: this.tx.recipientId,
              name: this.getPreferred(this.tx.recipientId),
              url: this.getExplorerPath(this.tx.recipientId),
              label: this.$t('transaction.overview.accountAddress'),
            },
            title: this.$t('transaction.type.spendTx'),
          };
        case SCHEMA.TX_TYPE.contractCall: {
          const direction = this.getTxDirection({ tx: this.tx });
          const contract = {
            address: this.tx.contractId,
            url: this.getExplorerPath(this.tx.contractId),
            label: this.$t('transaction.overview.contract'),
          };
          return {
            sender: direction === 'sent' ? this.account : contract,
            recipient: direction === 'received' ? this.account : contract,
            title: this.$t('transaction.type.contractCallTx'),
          };
        }
        case SCHEMA.TX_TYPE.contractCreate:
          return {
            sender: this.account,
            recipient: {
              contractCreate: true,
              label: this.$t('transaction.overview.contractCreate'),
            },
            title: this.$t('transaction.type.contractCreateTx'),
          };
        case SCHEMA.TX_TYPE.namePreClaim:
        case SCHEMA.TX_TYPE.nameClaim:
        case SCHEMA.TX_TYPE.nameBid:
        case SCHEMA.TX_TYPE.nameUpdate:
          return {
            sender: this.account,
            recipient: {
              aens: true,
              label: this.$t('transaction.overview.aens'),
            },
            title: this.$t('transaction.type')[this.txType],
          };
        default:
          throw new Error('Unsupported transaction type');
      }
    },
    txType() {
      return this.getTxType({ tx: this.tx });
    },
  },
};
</script>
