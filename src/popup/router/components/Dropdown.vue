<template>
  <div class="dropdown">
    <label v-if="label" class="label">{{ label }}</label>
    <div class="display">
      <div class="text-ellipsis" :title="displayValue">
        {{ displayValue }}
      </div>
      <img src="../../../icons/carret-down.svg">
      <select v-model="selectedVal" @change="method($event)">
        <option v-for="{ text, value } in options" :key="value" :value="value">{{ text }}</option>
      </select>
    </div>
  </div>
</template>

<script>
export default {
  name: 'VueDropdown',
  props: {
    options: { type: Array, default: null },
    selected: { type: [String, Number], default: '' },
    method: { type: Function, required: true },
    label: { type: String },
  },
  data() {
    return {
      selectedVal: this.selected,
      optionsVal: this.options,
    };
  },
  computed: {
    displayValue() {
      const { text } = this.optionsVal.find(({ value }) => value === this.selectedVal) || {};
      return text || '';
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';
.label {
  text-align: left;
}

.dropdown {
  display: inline-block;
  position: relative;
  min-width: 6rem;
  width: 100%;

  .display {
    text-align: center;
    position: relative;
    color: $text-color;
    font-size: 0.75rem;
    background-color: $input-bg-color;
    padding: 0.6rem 2.2rem 0.6rem 0.85rem;
    border-radius: 0.25rem;
    line-height: 0.9rem;
    min-height: 2.2rem;
    display: flex;
    align-items: center;
    border: 2px solid #33343e !important;

    img {
      position: absolute;
      right: 0.85rem;
    }
    &:hover {
      cursor: pointer;
    }
    & > div {
      display: inline-block;
    }
  }

  select {
    bottom: 0;
    left: 0;
    opacity: 0;
    position: absolute;
    right: 0;
    top: 0;
    display: inline-block;
    width: 100%;
    height: calc(1.5em + 0.75rem + 2px);
    padding: 0.375rem 1.75rem 0.375rem 0.75rem;
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.5;
    color: #495057;
    vertical-align: middle;
    border: 1px solid #ced4da;
    border-radius: 0.25rem;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
  }
}
</style>