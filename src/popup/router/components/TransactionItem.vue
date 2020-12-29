<template>
  <div class="transaction-item">
    <div>
      <div class="status">
        <TokenAmount
          data-cy="amount"
          :amount="txAmount"
          :symbol="contractCallData ? availableTokens[contractCallData.token].symbol : 'AE'"
        />
        <span :class="status.value">{{ status.text }}</span>
      </div>
      <span data-cy="time">{{ transaction.microTime | formatDate }}</span>
    </div>
    <div class="details">
      <button v-if="tipUrl" class="url" @click="openUrl(tipUrl, true)">
        {{ tipUrl }}
      </button>
      <span v-else-if="address" class="address">
        {{ address }}
      </span>
      <span v-else>
        {{ transactionType }}
      </span>
      <button
        class="open-explorer"
        @click="openUrl(`${activeNetwork.explorerUrl}/transactions/${transaction.hash}`, true)"
      >
        <Eye />
      </button>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import { decode } from '@aeternity/aepp-sdk/es/tx/builder/helpers';
import { aettosToAe, categorizeContractCallTxObject, convertToken } from '../../utils/helper';
import { formatDate } from '../../utils';
import TokenAmount from './TokenAmount';
import openUrl from '../../utils/openUrl';
import Eye from '../../../icons/eye.svg?vue-component';

export default {
  components: { TokenAmount, Eye },
  props: {
    transaction: {
      type: Object,
      required: true,
    },
  },
  filters: {
    formatDate,
  },
  computed: {
    ...mapGetters(['account', 'activeNetwork']),
    ...mapState('fungibleTokens', ['availableTokens']),
    status() {
      if (
        ['senderId', 'accountId', 'ownerId', 'callerId']
          .map((key) => this.transaction.tx[key])
          .includes(this.account.publicKey)
      ) {
        return { text: this.$t('pages.transactions.sent'), value: 'sent' };
      }
      if (this.transaction.pending) {
        return { text: this.$t('pages.transactions.pending'), value: 'pending' };
      }
      return { text: this.$t('pages.transactions.received'), value: 'received' };
    },
    contractCallData() {
      return categorizeContractCallTxObject(this.transaction);
    },
    txAmount() {
      if (this.contractCallData) {
        return +convertToken(
          this.contractCallData.amount,
          -this.availableTokens[this.contractCallData.token].decimals,
        );
      }
      const amount = this.transaction.tx.amount || this.transaction.tx.name_fee || 0;
      const fee = this.transaction.tx.fee || 0;
      return +aettosToAe(+amount + fee);
    },
    tipUrl() {
      return (
        this.transaction.tipUrl ||
        this.transaction.url ||
        (!this.transaction.pending &&
          !this.transaction.claim &&
          this.transaction.tx.log?.[0] &&
          decode(this.transaction.tx.log[0].data).toString()) ||
        this.contractCallData?.url ||
        ''
      );
    },
    topup() {
      return (
        this.transaction.tx.type === 'SpendTx' &&
        this.transaction.tx.recipientId === this.account.publicKey
      );
    },
    transactionType() {
      return this.$t('transaction.type')[this.transaction.tx.type];
    },
    address() {
      return this.topup
        ? this.transaction.tx.senderId
        : this.contractCallData?.to || this.transaction.tx.recipientId;
    },
  },
  methods: {
    openUrl,
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.transaction-item {
  padding: 10px 0;
  border-color: $bg-color;
  border-top: 1px solid $tx-border-color;

  > div {
    display: flex;
    justify-content: space-between;
    align-items: center;
    line-height: 19px;
    color: $text-color;
    font-size: 12px;
    font-weight: 500;

    &.details {
      line-height: 16px;
      font-weight: 400;
    }

    .status {
      font-size: 14px;
      color: $white-color;
      text-align: left;

      .sent {
        color: #a32e2d;
      }

      .received {
        color: #00804e;
      }
    }

    button {
      border: none;
      outline: none;
      background: none;
      font: inherit;
      color: inherit;
      padding: 0;
      cursor: pointer;
    }

    .url {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .address {
      font-size: 9px;
      letter-spacing: -0.1px;
    }
  }

  .open-explorer {
    color: $gray-2;

    &:hover {
      color: $white-1;
    }
  }
}
</style>
