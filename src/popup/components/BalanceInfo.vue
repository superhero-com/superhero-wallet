<template>
  <div
    class="balance-info"
    data-cy="balance-info"
    :class="{ isMultisig }"
  >
    <template v-if="isOnline">
      <MainBalance
        :balance="balance"
        :protocol="protocol"
      />
      <div class="display-value">
        {{ currencyFormatted }}
      </div>
    </template>
    <MessageOffline
      v-else
      :text="$t('common.balanceUnavailable')"
      :horizontal="horizontalOfflineMessage"
      :disable-colors="!horizontalOfflineMessage"
    />
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
} from 'vue';
import { useStore } from 'vuex';
import type { Protocol } from '@/types';
import { useConnection, useCurrencies } from '@/composables';
import { PROTOCOL_AETERNITY } from '@/constants';
import MainBalance from './MainBalance.vue';
import MessageOffline from './MessageOffline.vue';

export default defineComponent({
  components: {
    MainBalance,
    MessageOffline,
  },
  props: {
    balance: { type: Number, required: true },
    protocol: { type: String as PropType<Protocol>, default: PROTOCOL_AETERNITY },
    horizontalOfflineMessage: Boolean,
    isMultisig: Boolean,
  },
  setup(props) {
    const store = useStore();
    const { getFormattedFiat } = useCurrencies({ store, selectedProtocol: props.protocol });
    const { isOnline } = useConnection();
    console.log(props.isMultisig);
    const currencyFormatted = computed(() => getFormattedFiat(props.balance));

    return {
      isOnline,
      currencyFormatted,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.balance-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 8px;

  &.isMultisig {
    padding-top: 5em;
  }

  .display-value {
    @extend %face-sans-16-medium;

    color: rgba(variables.$color-white, 1);
    line-height: 18px;
    margin-top: 4px;
    opacity: 0.75;
  }
}
</style>
