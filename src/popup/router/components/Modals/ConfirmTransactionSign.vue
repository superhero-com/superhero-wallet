<template>
  <Modal class="confirm-tx-sign-modal" :close="false">
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
        <span class="account-address">{{
          txType === 'contractCreateTx'
            ? $t('modals.confirm-transaction-sign.contract-create')
            : $t('modals.confirm-transaction-sign.aens')
        }}</span>
      </div>
    </div>
    <template slot="body">
      <li>
        <ae-badge>{{ txType }}</ae-badge>
      </li>
      <li class="flex flex-justify-between">
        <div class="tx-label">{{ $t('pages.signTransaction.fee') }}</div>
        <div class="text-right">
          <div class="balance balanceBig txFee no-sign">
            {{ toAe(transaction.fee) }} {{ $t('pages.appVUE.aeid') }}
          </div>
        </div>
      </li>

      <li class="flex flex-justify-between">
        <div class="tx-label">{{ $t('pages.signTransaction.total') }}</div>
        <div class="text-right">
          <div class="balance balanceBig balanceTotalSpend no-sign">
            {{ totalSpend }} {{ $t('pages.appVUE.aeid') }}
          </div>
        </div>
      </li>
    </template>

    <div class="modal-confirm-btns" slot="footer">
      <Button dark @click="cancel">
        {{ $t('modals.cancel') }}
      </Button>
      <Button @click="confirm">
        {{ $t('modals.confirm') }}
      </Button>
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

export default {
  props: {
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
    transaction: { type: Object, required: true },
  },
  components: { Modal, Button, UserAvatar },
  data() {
    return {
      newFee: this.transaction.fee,
    };
  },
  created() {
    console.log(this.transaction);
  },
  computed: {
    ...mapGetters(['account', 'activeAccountName']),
    receiver() {
      return this.transaction.contractId || this.transaction.recipientId || '';
    },
    showAddress() {
      return (
        this.txType ===
        (TX_TYPE.contractCreate || TX_TYPE.namePreClaim || TX_TYPE.nameClaim || TX_TYPE.nameUpdate)
      );
    },
    txType() {
      return OBJECT_ID_TX_TYPE[this.transaction.tag];
    },
    transactionType() {
      console.log(this.txType);
      console.log(this.transaction);
      return this.$t('transaction.type')[this.txType];
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
      this.resolve(this.newFee);
    },
    cancel() {
      this.reject(new Error('reject'));
    },
  },
};
</script>

<style lang="scss">
@import '../../../../common/variables';

.confirm-tx-sign-modal {
  .modal--container {
    width: 100%;
    height: 100%;
    overflow-y: scroll;
    padding: 0;
    border-radius: 0;

    .modal--body,
    .modal--header {
      max-width: 357px;
      margin: 0 auto;
      min-width: 357px;
    }

    .modal-confirm-btns {
      position: fixed;
      bottom: 15px;
      left: 50%;
      -webkit-transform: translateX(-50%);
      -ms-transform: translateX(-50%);
      transform: translateX(-50%);
      max-width: 480px;
      min-width: 357px;

      button {
        width: 50% !important;
      }
    }

    .modal--body {
      li {
        list-style-type: none;
        padding: 10px;
        text-align: left;
      }

      .ae-badge {
        background: $secondary-color !important;
        color: $white-color !important;
        -webkit-box-shadow: 0 0 0 2px $secondary-color;
        box-shadow: 0px 0px 0px 2px $secondary-color;
        border: 2px solid $bg-color;
      }
    }
  }

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
    }

    .from {
      // width: 40%;
      padding-right: 15px;
      background: #33343e;
    }

    .to {
      // width: 70%;
      padding-left: 15px;
      background: #33343ea1;
    }

    .account-address {
      padding: 0 0.5rem !important;
      font-weight: normal !important;
      font-size: 0.8rem !important;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 80%;
      text-align: left;
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
        font-size: 1.2rem !important;
        float: none !important;
      }
      &:after {
        content: '';
      }
    }
  }
}
</style>
