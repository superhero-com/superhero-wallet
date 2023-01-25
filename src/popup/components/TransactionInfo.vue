<template>
  <div class="transaction-info">
    <div class="title-tag-wrapper">
      <TransactionTag
        v-for="label in labels"
        :key="label"
        :tx-type="label"
        class="title-tag"
        data-cy="label"
      />
    </div>

    <div class="parties">
      <Avatar
        v-if="sender.address"
        :name="sender.name || sender.label"
        :address="sender.address"
      />
      <div class="mid">
        <TriangleRight class="triangle" />
        <div class="line" />
      </div>

      <Avatar
        v-if="recipient.address"
        :address="recipient.address"
        :name="recipient.name || recipient.label"
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

<script lang="ts">
import {
  defineComponent,
  PropType,
} from '@vue/composition-api';
import type {
  ITransaction,
  ITx,
} from '../../types';
import { useTransaction } from '../../composables/transaction';
import TriangleRight from '../../icons/triangle-right.svg?vue-component';
import ActionIcon from '../../icons/action.svg?vue-component';
import AensIcon from '../../icons/aens.svg?vue-component';
import Avatar from './Avatar.vue';
import TransactionTag from './TransactionTag.vue';
import TransactionInfoDetailsParty from './TransactionInfoDetailsParty.vue';

export default defineComponent({
  name: 'TransactionInfo',
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
    tx: { type: Object as PropType<ITx>, default: null },
  },
  setup(props, { root }) {
    const { labels } = useTransaction({
      store: root.$store,
      initTransaction: { tx: props.tx } as ITransaction,
    });

    return {
      labels,
    };
  },
});
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
    overflow: hidden;
  }
}
</style>
