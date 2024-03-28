<template>
  <div class="transaction-info">
    <TransactionTagList
      v-bind="$attrs"
      :transaction="transaction"
    />

    <div class="parties">
      <Avatar
        v-if="sender.address"
        :name="sender.name"
        :address="sender.address"
        size="lg"
      />

      <div class="mid">
        <TriangleRight class="triangle" />
        <div class="line" />
      </div>

      <Avatar
        v-if="recipient.address"
        :address="recipient.address"
        :name="recipient.name"
        size="lg"
      />
      <div
        v-else
        class="custom-avatar"
      >
        <AensIcon
          v-if="recipient.aens"
          class="icon"
        />
        <SHLogo
          v-if="recipient.wallet"
          class="icon logo"
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
} from 'vue';
import type { IAccountOverview, ITransaction } from '@/types';
import TriangleRight from '../../icons/triangle-right.svg?vue-component';
import ActionIcon from '../../icons/action.svg?vue-component';
import AensIcon from '../../icons/aens.svg?vue-component';
import SHLogo from '../../icons/logo-small.svg?vue-component';

import Avatar from './Avatar.vue';
import TransactionInfoDetailsParty from './TransactionInfoDetailsParty.vue';
import TransactionTagList from './TransactionTagList.vue';

export default defineComponent({
  name: 'TransactionInfo',
  components: {
    TransactionTagList,
    TransactionInfoDetailsParty,
    TriangleRight,
    ActionIcon,
    AensIcon,
    Avatar,
    SHLogo,
  },
  props: {
    transaction: { type: Object as PropType<ITransaction>, default: null },
    sender: { type: Object as PropType<IAccountOverview>, required: true },
    recipient: { type: Object as PropType<IAccountOverview>, required: true },
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.transaction-info {
  .parties {
    display: flex;
    padding-bottom: 8px;

    .custom-avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 48px;
      height: 48px;
      border: 2px solid variables.$color-grey-border;
      border-radius: 100px;
    }

    .icon {
      width: 36px;
      height: 36px;
      color: variables.$color-white;
    }

    .logo {
      color: variables.$color-primary;
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
