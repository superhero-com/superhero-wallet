<template>
  <div class="main-balance">
    <span class="token-symbol">{{ tokenSymbol }}</span>
    <span class="token-integer">{{ balanceParts.integer }}.</span>
    <span class="token-fractional">{{ balanceParts.fraction }}</span>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
} from 'vue';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { Protocol } from '../../types';

export default defineComponent({
  props: {
    balance: { type: Number, default: 0 },
    protocol: { type: String as PropType<Protocol>, required: true },
  },
  setup(props) {
    const balanceParts = computed(() => {
      const [integer, fraction] = props.balance.toFixed(2).split('.');
      return {
        integer: Number(integer).toLocaleString(),
        fraction,
      };
    });

    const tokenSymbol = computed(
      () => ProtocolAdapterFactory.getAdapter(props.protocol).getCoinSymbol(true),
    );

    return {
      tokenSymbol,
      balanceParts,
    };
  },
});
</script>

<style lang="scss">
@use '../../styles/typography';
@use '../../styles/variables';

.main-balance {
  display: flex;
  align-items: baseline;

  .token-symbol {
    @extend %face-sans-24-semi-bold;

    color: variables.$color-white;
    margin-right: 4px;
    text-transform: uppercase;
  }

  .token-integer {
    @extend %face-sans-30-semi-bold;

    color: variables.$color-white;
  }

  .token-fractional {
    @extend %face-sans-24-semi-bold;

    color: rgba(variables.$color-white, 0.75);
    opacity: 0.75;
  }

  .token-symbol,
  .token-integer,
  .token-fractional {
    line-height: 32px;
  }
}
</style>
