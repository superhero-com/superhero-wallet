<template>
  <div class="transfer-send-base">
    <template v-if="$slots.header">
      <slot
        name="header"
      />
    </template>
    <template v-else>
      <ModalHeader :title="customTitle || $t('modals.send.sendTitle')" />
      <div class="account-row">
        <AccountItem
          :address="activeAccount.address"
          :protocol="activeAccount.protocol"
          :name="activeAccount.name"
          size="md"
        />
      </div>
    </template>

    <slot name="recipient" />

    <slot name="amount" />

    <slot name="extra" />

    <DetailsItem :label="maxFee ? $t('transaction.estimatedFee') : $t('transaction.fee')">
      <template #value>
        <TokenAmount
          :amount="fee"
          :symbol="feeSymbol"
          :protocol="protocol"
          blink-on-change
          data-cy="review-fee"
        />
      </template>
    </DetailsItem>
    <DetailsItem
      v-if="maxFee"
      :label="$t('transaction.maxFee')"
    >
      <template #value>
        <TokenAmount
          :amount="maxFee"
          :symbol="feeSymbol"
          :protocol="protocol"
          blink-on-change
          data-cy="review-max-fee"
        />
      </template>
    </DetailsItem>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
} from 'vue';
import type { Protocol } from '@/types';
import { useAccounts } from '@/composables';

import DetailsItem from './DetailsItem.vue';
import TokenAmount from './TokenAmount.vue';
import ModalHeader from './ModalHeader.vue';
import AccountItem from './AccountItem.vue';

export default defineComponent({
  name: 'TransferSendFormBase',
  components: {
    ModalHeader,
    AccountItem,
    DetailsItem,
    TokenAmount,
  },
  props: {
    fee: { type: Number, default: 0 },
    maxFee: { type: Number, default: undefined },
    feeSymbol: { type: String, required: true },
    customTitle: { type: String, default: '' },
    protocol: { type: String as PropType<Protocol>, required: true },
  },
  setup() {
    const { activeAccount } = useAccounts();

    return {
      activeAccount,
    };
  },
});
</script>

<style lang="scss" scoped>
.transfer-send-base {
  .account-row {
    display: flex;
    justify-content: center;
  }
}
</style>
