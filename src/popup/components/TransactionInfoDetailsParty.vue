<template>
  <div
    class="transaction-info-details-party"
    :class="{ recipient: isRecipient }"
  >
    <a
      v-if="txParty.url || !isRecipient"
      :href="txParty.url"
      target="_blank"
      class="name"
    >
      <Truncate
        :right="isRecipient"
        :str="punycodeToName(txParty.name) || txParty.label"
      />
    </a>
    <span
      v-else
      class="name"
      :class="{ aens: txParty.aens }"
    >
      {{ txParty.label }}
    </span>
    <CopyText
      v-if="txParty.address"
      hide-icon
      :value="txParty.address"
    >
      <AddressFormatted
        :address="txParty.address"
        :columns="!isAddressChain"
        :column-count="5"
        :align-right="isRecipient"
        class="text-address"
      />
    </CopyText>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import { punycodeToName } from '../utils/names';
import { checkAensName } from '../utils';
import CopyText from './CopyText.vue';
import Truncate from './Truncate.vue';
import AddressFormatted from './AddressFormatted.vue';

export default defineComponent({
  components: {
    AddressFormatted,
    CopyText,
    Truncate,
  },
  props: {
    isRecipient: Boolean,
    txParty: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    const isAddressChain = computed(() => checkAensName(props.txParty.address));

    return {
      isAddressChain,
      punycodeToName,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.transaction-info-details-party {
  width: 50%;
  max-width: 50%;

  &.recipient {
    .name {
      text-align: right;
    }
  }

  .name {
    @extend %face-sans-15-medium;

    display: block;
    margin-bottom: 8px;
    color: variables.$color-white;
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
