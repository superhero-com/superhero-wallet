<template>
  <div class="tabs-menu">
    <button
      v-for="{ text, name } in tabOptions"
      :key="name"
      :class="{ active: name === value }"
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
  background-color: $color-bg-3;

  button {
    font-size: 16px;
    padding: 5.5px 0;
    margin-right: 17px;
    text-decoration: none;
    color: $color-dark-grey;
    display: inline-block;

    &:hover {
      color: $color-light-grey;
    }

    &.active {
      color: $color-green;
      border-bottom: 1px solid $color-green;
    }

    &:last-child {
      margin-right: 0;
    }
  }
}
</style>
