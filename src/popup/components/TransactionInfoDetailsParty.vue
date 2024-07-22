<template>
  <div
    class="transaction-info-details-party"
    :class="{ recipient: isRecipient }"
  >
    <LinkButton
      v-if="txParty.url || !isRecipient"
      :href="txParty.url"
      class="name"
    >
      <Truncate
        :right="isRecipient"
        :str="txParty.name || txParty.label || $t('common.fellowSuperhero')"
      />
    </LinkButton>
    <span
      v-else-if="txParty.wallet"
      class="wallet"
    >
      {{ $t('common.title') }}
    </span>
    <span
      v-else
      class="name"
      :class="{ aens: txParty.aens }"
    >
      {{ txParty.label || $t('transaction.overview.accountAddress') }}
    </span>
    <CopyText
      v-if="txParty.address"
      hide-icon
      :value="txParty.address"
    >
      <AddressFormatted
        :address="txParty.address"
        :column-count="5"
        :align-right="isRecipient"
        class="text-address"
        data-cy="address"
      />
    </CopyText>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { IAccountOverview } from '@/types';

import CopyText from './CopyText.vue';
import Truncate from './Truncate.vue';
import AddressFormatted from './AddressFormatted.vue';
import LinkButton from './LinkButton.vue';

export default defineComponent({
  components: {
    AddressFormatted,
    CopyText,
    LinkButton,
    Truncate,
  },
  props: {
    isRecipient: Boolean,
    txParty: {
      type: Object as PropType<IAccountOverview>,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.transaction-info-details-party {
  $padding-edge: 4px;
  $padding-middle: 11px;

  width: 50%;
  padding-left: $padding-edge;
  padding-right: $padding-middle;

  &.recipient {
    padding-left: $padding-middle;
    padding-right: $padding-edge;

    .name,
    .wallet {
      text-align: right;
    }
  }

  .name,
  .wallet {
    @extend %face-sans-15-medium;

    display: block;
    margin-bottom: 8px;
    color: $color-white;
    text-decoration: none;
    white-space: nowrap;
    line-height: 16px;
  }

  .copy-address {
    @extend %face-mono-12-medium;

    height: 48px;
  }
}
</style>
