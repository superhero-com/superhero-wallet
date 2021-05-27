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
@use '../../../styles/variables';
@use '../../../styles/typography';

.tabs-menu {
  padding: 0 15px;
  background-color: variables.$color-bg-3;

  button {
    font-size: 10px;
    padding: 5.5px 0;
    margin-right: 17px;
    text-decoration: none;
    color: variables.$color-light-grey;
    display: inline-block;
    letter-spacing: 1px;
    text-transform: uppercase;

    @extend %face-sans-10-medium;

    &:hover {
      color: variables.$color-light-grey;
    }

    &.active {
      color: variables.$color-green;
      border-bottom: 1px solid variables.$color-green;
    }

    &:last-child {
      margin-right: 0;
    }
  }
}
</style>
