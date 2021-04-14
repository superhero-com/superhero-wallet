<template>
  <div class="transaction-overview">
    <span class="title">
      {{ transaction.title }}
    </span>

    <div class="parties">
      <Avatar v-bind="transaction.sender" />
      <div class="mid">
        <TriangleRight />
        <div class="line" />
      </div>
      <Avatar
        v-if="transaction.recipient.address"
        v-bind="transaction.recipient"
      />
      <div
        v-else
        class="avatar"
      >
        <AensIcon
          v-if="transaction.aens"
          class="icon"
        />
        <ActionIcon
          v-else
          class="icon"
        />
      </div>
    </div>

    <div class="details">
      <div class="sender">
        <a
          :href="connect ? app.host : getExplorerPath(transaction.sender.address)"
          target="_blank"
          class="name"
        >
          <TruncateMid :str="transaction.sender.name || transaction.sender.label" />
        </a>
        <CopyAddress :value="transaction.sender.address" />
      </div>
      <div class="recipient">
        <span
          v-if="transaction.aens || transaction.contractCreate"
          :class="{ aens: transaction.aens }"
          class="name"
        >
          {{ transaction.recipient.label }}
        </span>
        <a
          v-else
          :href="getExplorerPath(transaction.recipient.address)"
          target="_blank"
          class="name"
        >
          <TruncateMid :str="transaction.recipient.name || transaction.recipient.label" />
        </a>
        <CopyAddress v-if="transaction.recipient.address" :value="transaction.recipient.address" />
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import { TX_TYPE, OBJECT_ID_TX_TYPE } from '@aeternity/aepp-sdk/es/tx/builder/schema';
import { TX_TYPE_MDW } from '../../utils/constants';
import TriangleRight from '../../../icons/triangle-right.svg?vue-component';
import ActionIcon from '../../../icons/action.svg?vue-component';
import AensIcon from '../../../icons/aens.svg?vue-component';
import Avatar from './Avatar';
import TruncateMid from './TruncateMid';
import CopyAddress from './CopyAddress';

export default {
  components: {
    Avatar,
    TruncateMid,
    CopyAddress,
    TriangleRight,
    AensIcon,
    ActionIcon,
  },
  props: {
    tx: { type: Object, default: null },
    connect: { type: Boolean, default: false },
    app: { type: Object, default: null },
  },
  computed: {
    ...mapGetters(['getTxDirection', 'getExplorerPath']),
    ...mapState({
      account(_, { account }) {
        return {
          ...account,
          label: this.$t('transaction.overview.accountAddress'),
        };
      },
    }),
    transaction() {
      if (this.connect) {
        return {
          sender: {
            address: this.app.host,
            name: this.app.name,
          },
          recipient: this.account,
          title: this.$t('pages.connectConfirm.connecting'),
        };
      }
      switch (this.txType) {
        case TX_TYPE.spend:
          return {
            sender: {
              address: this.tx.senderId,
              name: this.getDisplayName(this.tx.senderId),
              label: this.$t('transaction.overview.accountAddress'),
            },
            recipient: {
              address: this.tx.recipientId,
              name: this.getDisplayName(this.tx.recipientId),
              label: this.$t('transaction.overview.accountAddress'),
            },
            title: this.$t('transaction.type.spendTx'),
          };
        case TX_TYPE.contractCall: {
          const direction = this.getTxDirection({ tx: this.tx });
          const contract = {
            address: this.tx.contractId,
            label: this.$t('transaction.overview.contract'),
          };
          return {
            sender: direction === 'sent' ? this.account : contract,
            recipient: direction === 'received' ? this.account : contract,
            title: this.$t('transaction.type.contractCallTx'),
          };
        }
        case TX_TYPE.contractCreate:
          return {
            contractCreate: true,
            sender: this.account,
            recipient: {
              label: this.$t('transaction.overview.contractCreate'),
            },
            title: this.$t('transaction.type.contractCreateTx'),
          };
        case TX_TYPE.namePreClaim:
        case TX_TYPE.nameClaim:
        case TX_TYPE.nameBid:
        case TX_TYPE.nameUpdate:
          return {
            aens: true,
            sender: this.account,
            recipient: {
              label: this.$t('transaction.overview.aens'),
            },
            title: this.$t('transaction.type')[this.txType],
          };
        default:
          throw new Error('Unsupported transaction type');
      }
    },
    txType() {
      return (
        TX_TYPE_MDW[this.tx.type]
        || OBJECT_ID_TX_TYPE[this.tx.tag]
        || (Object.values(TX_TYPE).includes(this.tx.type) && this.tx.type)
      );
    },
  },
  methods: {
    getDisplayName(address) {
      return this.account.address === address ? this.account.name : '';
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';
@import '../../../styles/typography';

.transaction-overview {
  .title {
    @extend %face-sans-15-regular;

    color: $color-white;
    text-align: center;
    display: block;
    margin-bottom: -8px;
  }

  .parties {
    display: flex;
    padding-bottom: 8px;

    .avatar {
      width: 56px;
      height: 56px;
      padding: 8px;
      border: 2px solid $color-blue;
      border-radius: 100px;
    }

    .icon {
      width: 36px;
      height: 36px;
      color: $color-white;
    }

    .mid {
      position: relative;
      width: 100%;

      svg {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 15px;
        height: 17px;
        color: $color-blue;
      }

      .line {
        height: calc(50% + 1px);
        border-bottom: 2px solid $color-blue;
      }
    }
  }

  .details {
    display: flex;
    justify-content: space-between;

    .sender {
      width: 148px;
      text-align: left;
    }

    .recipient {
      width: 148px;
      text-align: right;

      .name.aens {
        padding-right: 8px;
      }
    }

    .name {
      display: block;
      margin-bottom: 4px;
      font-size: 15px;
      line-height: 16px;
      color: $color-white;

      &:hover .truncate-mid {
        &::before,
        &::after {
          text-decoration: underline;
        }
      }
    }

    .copy-address {
      height: 48px;
    }
  }
}
</style>
