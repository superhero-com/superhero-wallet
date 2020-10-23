<template>
  <div class="tabs-menu">
    <button
      :class="{ active: selected === value }"
      v-for="{ text, value } in tabOptions"
      :key="value"
      @click="(selected = value), method($event, value)"
    >
      {{ text }}
    </button>
  </div>
</template>

<script>
export default {
  props: {
    tabOptions: { type: Array, default: null },
    activeTab: { type: [String, Number], default: '' },
    method: { type: Function, required: true },
  },
  data() {
    return {
      selected: this.activeTab,
    };
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';

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
