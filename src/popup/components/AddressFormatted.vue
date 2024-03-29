<template>
  <div class="address-formatted">
    <template v-if="isAddress">
      <span
        v-for="(chunk, index) in addressChunks"
        :key="index"
        class="address-formatted-chunk"
        :class="{ 'align-right': alignRight }"
        :style="cssVariable"
      >
        {{ chunk }}
      </span>
    </template>
    <span v-else>{{ address }}</span>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useNetworks } from '@/composables';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

export default defineComponent({
  props: {
    address: { type: String, required: true },
    columnCount: { type: Number, default: 6 },
    alignRight: Boolean,
  },
  setup(props) {
    const maxLength = 3;

    const { activeNetwork } = useNetworks();

    function prepareChunk(chunk: any) {
      return chunk.length === maxLength ? chunk : `${chunk}${' '.repeat(maxLength - chunk.length)}`;
    }

    const isAddress = computed(() => {
      const networkType = activeNetwork.value?.type;
      return !!ProtocolAdapterFactory
        .getAdapterByAddressOrNameEncoding(props.address, networkType);
    });
    const addressChunks = computed(() => props.address.match(/.{1,3}/g)?.map(prepareChunk));
    const cssVariable = computed(() => ({
      '--column-width': `${100 / props.columnCount}%`,
    }));

    return {
      prepareChunk,
      isAddress,
      addressChunks,
      cssVariable,
    };
  },
});
</script>

<style lang="scss" scoped>
.address-formatted {
  display: inline-flex;
  flex-wrap: wrap;
  letter-spacing: 0.15em;

  &-chunk {
    flex: 0 0 var(--column-width);
    text-align: left;
    white-space: nowrap;

    &.align-right {
      text-align: right;
      white-space: break-spaces;
    }
  }
}
</style>
