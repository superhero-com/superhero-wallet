<template>
  <div class="address-formatted">
    <template v-if="columns">
      <span
        v-for="(chunk, index) in addressChunks"
        :key="index"
        class="address-formatted-chunk"
        :class="{ 'align-right': alignRight }"
        :style="cssVariable"
      >{{ chunk }}</span>
    </template>
    <span v-else>{{ address }}</span>
  </div>
</template>

<script>
export default {
  props: {
    address: { type: String, required: true },
    columnCount: { type: Number, default: 6 },
    columns: Boolean,
    alignRight: Boolean,
  },
  computed: {
    cssVariable() {
      return {
        '--column-width': `${100 / this.columnCount}%`,
      };
    },
    addressChunks() {
      return this.address.match(/.{1,3}/g).map(this.prepareChunk);
    },
  },
  methods: {
    prepareChunk(chunk) {
      const maxLength = 3;
      return chunk.length === maxLength ? chunk : `${chunk}${' '.repeat(maxLength - chunk.length)}`;
    },
  },
};
</script>

<style lang="scss" scoped>
.address-formatted {
  display: inline-flex;
  flex-wrap: wrap;
  letter-spacing: 0.15em;

  &-chunk {
    flex: 0 0 var(--column-width);

    &.align-right {
      text-align: right;
      white-space: break-spaces;
    }
  }
}
</style>
