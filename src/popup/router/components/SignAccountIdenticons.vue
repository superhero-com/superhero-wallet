<template>
  <div class="identicons-holder">
    <div class="from">
      <Avatar :address="account.publicKey" :name="account.name" />
      <span class="account-address" :title="activeAccountName">{{ activeAccountName }}</span>
    </div>
    <div class="arrow-separator">
      <ae-icon name="left-more" />
    </div>
    <div class="to" v-if="!showAddress">
      <Avatar :address="receiver" />
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
      <span class="account-address" data-cy="receiver">
        {{
          txType === 'contractCreateTx'
            ? $t('modals.confirm-transaction-sign.contract-create')
            : $t('modals.confirm-transaction-sign.aens')
        }}
      </span>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { OBJECT_ID_TX_TYPE, TX_TYPE } from '@aeternity/aepp-sdk/es/tx/builder/schema';
import Avatar from './Avatar';

export default {
  props: {
    transaction: { type: Object, required: true },
  },
  components: { Avatar },
  computed: {
    ...mapGetters(['account', 'activeAccountName']),
    receiver() {
      return this.transaction.recipientId || this.transaction.contractId || '';
    },
    showAddress() {
      return [
        TX_TYPE.contractCreate,
        TX_TYPE.namePreClaim,
        TX_TYPE.nameClaim,
        TX_TYPE.nameUpdate,
      ].includes(this.transaction.txType);
    },
    txType() {
      return OBJECT_ID_TX_TYPE[this.transaction.tag];
    },
  },
};
</script>
<style lang="scss" scoped>
@import '../../../styles/variables';

.identicons-holder {
  display: flex;
  justify-content: space-between;
  position: relative;

  .from,
  .to {
    display: flex;
    align-items: center;
    width: 50%;
    padding: 10px;

    .account-address {
      padding: 0 0.5rem;
      font-weight: normal;
      font-size: 0.8rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 80%;
      text-align: left;
    }
  }

  .from {
    padding-right: 15px;
    background: #33343e;
  }

  .to {
    padding-left: 15px;
    background: #33343ea1;
  }

  .arrow-separator {
    position: absolute;
    left: 50%;
    top: 50%;
    -ms-transform: translate(-50%, -50%);
    -webkit-transform: translate(-50%, -50%);
    transform: translate(-50%, -50%);
    background: $button-color;
    color: $white-color;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    text-align: center;
    vertical-align: middle;
    border: 1px solid $white-color;
    line-height: 20px;

    .ae-icon {
      font-size: 1.2rem;
      float: none;
    }

    &::after {
      content: '';
    }
  }
}
</style>
