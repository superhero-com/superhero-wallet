<template>
  <div class="dropdown">
    <div v-if="openDropdown" @click="openDropdown = false" class="dropdown-overlay"></div>
    <label v-if="label" class="label">{{ label }}</label>
    <div v-if="!isCustom" class="display">
      <div class="text-ellipsis" :title="displayValue">
        {{ displayValue }}
      </div>
      <img src="../../../icons/carret-down.svg" />
      <select v-model="selectedVal" @change="method($event)">
        <option v-for="{ text, value } in options" :key="value" :value="value">{{ text }}</option>
      </select>
    </div>
    <div
      class="custom"
      v-else
      @click.stop="openDropdown = !openDropdown"
      :class="{ show: openDropdown }"
      data-cy="custom-dropdown"
    >
      <ae-button>
        {{ displayValue }}
        <ExpandedAngleArrow />
      </ae-button>
      <ul class="list">
        <li class="list-item" v-for="{ text, value } in options" :key="value" :value="value">
          <ae-button @click="(selectedVal = value), method(value)">
            {{ text }}
          </ae-button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import ExpandedAngleArrow from '../../../icons/expanded-angle-arrow.svg?vue-component';

export default {
  name: 'VueDropdown',
  components: {
    ExpandedAngleArrow,
  },
  props: {
    options: { type: Array, default: null },
    selected: { type: [String, Number], default: '' },
    method: { type: Function, required: true },
    label: { type: String },
    isCustom: { type: Boolean },
  },
  data() {
    return {
      selectedVal: this.selected,
      openDropdown: false,
    };
  },
  computed: {
    displayValue() {
      const { text } = this.options.find(({ value }) => value === this.selectedVal) || {};
      return text || '';
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.label {
  text-align: left;
}

.dropdown {
  display: inline-block;
  position: relative;
  min-width: 6rem;
  width: 100%;
  margin-bottom: 22px;

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
    border: 2px solid #33343e;

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

.custom {
  font-size: 18px;
  line-height: 24px;
  font-weight: 500;
  position: relative;

  svg {
    margin-left: 5px;
  }

  li {
    list-style-type: none;

    .ae-icon {
      font-size: 1.2rem;
      margin: 10px 0 0 0;
    }
  }

  button {
    font-size: 15px;
    width: 100%;
    color: $text-color;
    text-align: left;
    margin: 0;
    padding: 0 5px;
  }

  ul {
    margin: 0;
    box-shadow: none;
    visibility: hidden;
    max-height: 0;
    padding: 0;
    overflow: hidden;
    transition: all 0.3s ease-in-out;
    background: $nav-bg-color;
    border: 1px solid $secondary-color;
    border-radius: 5px;
    scrollbar-width: none;
  }

  &.show ul.list {
    visibility: visible;
    max-height: 165px;
    overflow-y: scroll;
    position: relative;
    z-index: 10;
  }

  .list-item:hover {
    background: $box-button-color;
  }
}

.dropdown-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
</style>
