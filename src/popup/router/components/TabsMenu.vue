<template>
  <div class="tabs-menu">
    <button
      :class="{ active: name === value }"
      v-for="{ text, name } in tabOptions"
      :key="name"
      @click="$emit('input', name)"
    >
      {{ text }}
    </button>
  </div>
</template>

<script>
export default {
  props: {
    tabOptions: { type: Array, default: null },
    value: { type: [String, Number], default: '' },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.tabs-menu {
  padding: 0 15px;
  background-color: $black-3;

  button {
    font-size: 16px;
    padding: 5.5px 0;
    margin-right: 17px;
    text-decoration: none;
    color: $gray-2;
    display: inline-block;

    &:hover {
      color: $gray-1;
    }

    &.active {
      color: $accent-color;
      border-bottom: 1px solid $accent-color;
    }

    &:last-child {
      margin-right: 0;
    }
  }
}
</style>
