<template>
  <span
    :data-content-start="str.substr(0, str.length / 2)"
    :data-content-end="str.substr(str.length / 2)"
    class="truncate-mid"
  />
</template>

<script>
export default {
  props: {
    str: { type: String, required: true },
  },
};
</script>

<style lang="scss" scoped>
.truncate-mid {
  white-space: nowrap;

  &::before,
  &::after {
    display: inline-block;
    max-width: 50%;
    overflow: hidden;
    white-space: pre;
  }

  &::before {
    content: attr(data-content-start);
    text-overflow: ellipsis;
  }

  &::after {
    content: attr(data-content-end);
    direction: rtl;
  }
}
</style>
