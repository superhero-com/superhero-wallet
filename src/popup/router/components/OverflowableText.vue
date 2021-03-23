<template>
  <span class="overflowable-text">
    <span class="text">{{ text.substr(0, text.length / 2) }}</span>
    <span>{{ text.substr(text.length / 2) }}</span>
  </span>
</template>

<script>
export default {
  props: {
    text: { type: String, required: true },
  },
};
</script>

<style lang="scss" scoped>
.overflowable-text {
  display: flex;

  .text {
    text-overflow: ellipsis;
    overflow: hidden;
  }
}
</style>
