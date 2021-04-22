<template>
  <div class="identicons-holder">
    <div class="from">
      <Avatar
        :address="account.address"
        :name="account.name"
      />
      <span class="account-address">{{ account.name || account.localName }}</span>
    </div>
    <div class="arrow-separator">
      <ae-icon name="left-more" />
    </div>
    <div
      v-if="!showAddress"
      class="to"
    >
      <Avatar :address="receiver" />
      <ae-address
        v-if="receiver"
        :value="receiver"
        length="short"
        class="account-address"
        data-cy="address-receiver"
      />
      <span
        v-else
        class="account-address"
      >
        {{ $t('modals.confirm-transaction-sign.unknown') }}
      </span>
    </div>
    <div
      v-else
      class="to"
    >
      <ae-icon name="square" />
      <span
        class="account-address"
        data-cy="receiver"
      >
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
  components: { Avatar },
  props: {
    recipientId: { type: String, default: '' },
    contractId: { type: String, default: '' },
    tag: { type: String, required: true },
  },
  computed: {
    ...mapGetters(['account']),
    receiver() {
      return this.recipientId || this.contractId;
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
      return OBJECT_ID_TX_TYPE[this.tag];
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
    background: $color-border;
  }

  .to {
    padding-left: 15px;
    background: $color-border;
  }

  .arrow-separator {
    position: absolute;
    left: 50%;
    top: 50%;
    -ms-transform: translate(-50%, -50%);
    -webkit-transform: translate(-50%, -50%);
    transform: translate(-50%, -50%);
    background: $color-blue;
    color: $color-white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    text-align: center;
    vertical-align: middle;
    border: 1px solid $color-white;
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
