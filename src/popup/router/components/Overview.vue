<template>
  <div class="overview">
    <div
      v-if="isNewUI"
      class="title-tag-wrapper"
    >
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
    <span
      v-else
      class="title"
      data-cy="title"
    >
      {{ title }}
    </span>

    <div class="parties">
      <Avatar v-bind="sender" />
      <div class="mid">
        <TriangleRight />
        <div class="line" />
      </div>
      <Avatar
        v-if="recipient.address"
        v-bind="recipient"
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
      <div
        class="sender"
        data-cy="sender"
      >
        <a
          :href="sender.url"
          target="_blank"
          class="name"
        >
          <Truncate :str="sender.name || sender.label" />
        </a>
        <CopyAddress :value="sender.address" />
      </div>
      <div
        class="recipient"
        data-cy="recipient"
      >
        <a
          v-if="recipient.url"
          :href="recipient.url"
          target="_blank"
          class="name"
        >
          <Truncate :str="recipient.name || recipient.label" />
        </a>
        <span
          v-else
          class="name"
          :class="{ aens: recipient.aens }"
        >
          {{ recipient.label }}
        </span>
        <CopyAddress
          v-if="recipient.address"
          :value="recipient.address"
        />
      </div>
    </div>
  </div>
</template>

<script>
import Truncate from './Truncate.vue';
import CopyAddress from './CopyAddress.vue';
import TriangleRight from '../../../icons/triangle-right.svg?vue-component';
import ActionIcon from '../../../icons/action.svg?vue-component';
import AensIcon from '../../../icons/aens.svg?vue-component';
import Avatar from './Avatar.vue';
import TransactionTag from './TransactionTag.vue';
import { getDexTransactionTag } from '../../utils';
import { FUNCTION_TYPE_DEX } from '../../utils/constants';

export default {
  components: {
    Truncate,
    CopyAddress,
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
    isNewUI() {
      return !!this.$route.meta.newUI;
    },
    getTxType() {
      return this.$te(`transaction.dexType.${getDexTransactionTag[this.txFunction] || this.txFunction}`)
        ? this.$t(`transaction.dexType.${getDexTransactionTag[this.txFunction] || this.txFunction}`)
        : '';
    },
    getTitle() {
      return FUNCTION_TYPE_DEX.pool.includes(this.txFunction)
        ? this.$t('transaction.dexType.pool')
        : this.title;
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.overview {
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
    margin-bottom: -10px;
  }

  .parties {
    display: flex;
    padding-bottom: 8px;

    .avatar {
      width: 56px;
      height: 56px;
      padding: 8px;
      border: 2px solid variables.$color-blue;
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

      svg {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 15px;
        height: 17px;
        color: variables.$color-blue;
      }

      .line {
        height: calc(50% + 1px);
        border-bottom: 2px solid variables.$color-blue;
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

      .truncate {
        justify-content: flex-end;
      }

      .name.aens {
        padding-right: 8px;
      }
    }

    .name {
      display: block;
      margin-bottom: 8px;
      color: variables.$color-white;
      text-decoration: none;
      white-space: nowrap;

      @extend %face-sans-15-medium;

      line-height: 16px;

      &:hover {
        .truncate::v-deep span {
          text-decoration: underline;
        }
      }
    }

    .copy-address {
      @extend %face-mono-12-medium;

      height: 48px;
    }
  }
}
</style>
