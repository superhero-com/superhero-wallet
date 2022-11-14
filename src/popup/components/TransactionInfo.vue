<template>
  <div class="transaction-info">
    <div class="title-tag-wrapper">
      <TransactionTag
        :tx-type="getTitle"
        data-cy="title"
      />
      <TransactionTag
        v-if="txFunction && getTxType"
        :tx-type="getTxType"
        class="title-tag"
        data-cy="tx-function"
      />
    </div>

    <div class="parties">
      <Avatar
        v-bind="sender"
        :name="punycodeToName(sender.name)"
      />
      <div class="mid">
        <TriangleRight class="triangle" />
        <div class="line" />
      </div>
      <Avatar
        v-if="recipient.address"
        v-bind="recipient"
        :name="punycodeToName(recipient.name)"
      />
      <div
        v-else
        class="avatar"
      >
        <AensIcon
          v-if="recipient.aens"
          class="icon"
        />
        <ActionIcon
          v-else
          class="icon"
        />
      </div>
    </div>

    <div class="details">
      <TransactionInfoDetailsParty
        :tx-party="sender"
        data-cy="sender"
      />
      <TransactionInfoDetailsParty
        :tx-party="recipient"
        data-cy="recipient"
        is-recipient
      />
    </div>
  </div>
</template>

<script>
import TriangleRight from '../../icons/triangle-right.svg?vue-component';
import ActionIcon from '../../icons/action.svg?vue-component';
import AensIcon from '../../icons/aens.svg?vue-component';
import Avatar from './Avatar.vue';
import TransactionTag from './TransactionTag.vue';
import TransactionInfoDetailsParty from './TransactionInfoDetailsParty.vue';
import { DEX_TRANSACTION_TAGS, FUNCTION_TYPE_DEX } from '../utils';
import { punycodeToName } from '../utils/names';

export default {
  components: {
    TransactionInfoDetailsParty,
    TriangleRight,
    ActionIcon,
    AensIcon,
    Avatar,
    TransactionTag,
  },
  props: {
    title: { type: String, required: true },
    txFunction: { type: String, default: null },
    sender: { type: Object, required: true },
    recipient: { type: Object, required: true },
  },
  computed: {
    getTxType() {
      return this.$te(`transaction.dexType.${DEX_TRANSACTION_TAGS[this.txFunction] || this.txFunction}`)
        ? this.$t(`transaction.dexType.${DEX_TRANSACTION_TAGS[this.txFunction] || this.txFunction}`)
        : '';
    },
    getTitle() {
      return FUNCTION_TYPE_DEX.pool.includes(this.txFunction)
        ? this.$t('transaction.dexType.pool')
        : this.title;
    },
  },
  methods: {
    punycodeToName,
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.transaction-info {
  .title {
    @extend %face-sans-15-regular;

    color: variables.$color-white;
    text-align: center;
    display: block;
    margin-bottom: -8px;
  }

  .title-tag-wrapper {
    @include mixins.flex(center, center);

    gap: 8px;
    margin-bottom: -8px;
  }

  .parties {
    display: flex;
    padding-bottom: 8px;

    .avatar {
      width: 56px;
      height: 56px;
      padding: 8px;
      border: 2px solid variables.$color-grey-border;
      border-radius: 100px;
    }

    .icon {
      width: 36px;
      height: 36px;
      color: variables.$color-white;
    }

    .mid {
      position: relative;
      width: 100%;

      .triangle {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 15px;
        height: 17px;
        color: variables.$color-grey-border;
      }

      .line {
        height: calc(50% + 1px);
        border-bottom: 2px solid variables.$color-grey-border;
      }
    }
  }

  .details {
    display: flex;
    justify-content: space-between;
    padding: 0 4px;
    gap: 22px;
  }
}
</style>
