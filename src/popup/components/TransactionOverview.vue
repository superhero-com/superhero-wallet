<template>
  <Overview
    class="transaction-overview"
    :title="transaction.title"
    :sender="transaction.sender"
    :recipient="transaction.recipient"
    :tx-function="transaction.function"
  />
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import { SCHEMA } from '@aeternity/aepp-sdk';
import Overview from './Overview.vue';

export default {
  components: { Overview },
  props: {
    tx: { type: Object, required: true },
    isDex: { type: Boolean, default: false },
  },
  data: () => ({ name: '' }),
  computed: {
    ...mapGetters(['getTxType', 'getTxDirection', 'getExplorerPath', 'getDexContracts']),
    ...mapGetters('names', ['getPreferred']),
    ...mapState({
      account(_, { account }) {
        return {
          ...account,
          label: this.$t('transaction.overview.accountAddress'),
          url: this.getExplorerPath(account.address),
        };
      },
      isDexRecipient() {
        return [...this.getDexContracts.router, ...this.getDexContracts.wae]
          .includes(this.tx?.contractId);
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
              name: this.name || this.getPreferred(this.tx.recipientId),
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
            label: this.$t(`transaction.overview.${this.isDexRecipient ? 'superheroDex' : 'contract'}`),
          };
          return {
            sender: direction === 'sent' ? this.account : contract,
            recipient: direction === 'received' ? this.account : contract,
            title: this.$t('transaction.type.contractCallTx'),
            function: this.tx.function,
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
  async mounted() {
    await this.$watchUntilTruly(() => this.$store.state.middleware);
    if (this.tx.recipientId?.startsWith('nm_')) {
      this.name = (await this.$store.state.middleware.getNameByHash(this.tx.recipientId)).name;
    }
  },
};
</script>

<style scoped lang="scss">
@use '../../styles/mixins';

.tag-wrapper {
  @include mixins.flex(center, center);

  gap: 8px;
}
</style>
