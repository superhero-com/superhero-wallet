<template>
  <span class="truncate">
    <span>{{ nameComponent || str }}</span>
    <span v-if="nameComponent">{{ '.chain' }}</span>
  </span>
</template>

<script>
export default {
  props: {
    str: { type: String, required: true },
  },
  computed: {
    nameComponent() {
      return this.str.endsWith('.chain') ? this.str.replace('.chain', '') : '';
    },
  },
};
</script>

<style lang="scss" scoped>
.truncate {
  display: flex;

  span:first-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
