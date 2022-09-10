<template>
  <div class="address-formatted">
    <template v-if="columns">
      <span
        v-for="(chunk, index) in addressChunks"
        :key="index"
        class="address-formatted-chunk"
      >{{ chunk }}</span>
    </template>
    <span v-else>{{ address }}</span>
  </div>
</template>

<script>
export default {
  props: {
    address: { type: String, required: true },
    columns: Boolean,
  },
  computed: {
    addressChunks() {
      return this.address.match(/.{1,3}/g);
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
    flex: 0 0 16.5%;
  }
}
</style>
