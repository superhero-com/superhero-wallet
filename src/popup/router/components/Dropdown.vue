<template>
  <div class="dropdown">
    <div
      v-if="openDropdown"
      class="dropdown-overlay"
      @click="openDropdown = false"
    />
    <div
      :class="{ show: openDropdown }"
      data-cy="dropdown"
      @click.stop="openDropdown = !openDropdown"
    >
      <ae-button>
        {{ displayValue }}
      </ae-button>
      <ul class="list">
        <li
          v-for="{ text, value } in options"
          :key="value"
          class="list-item"
          :value="value"
        >
          <ae-button @click="(selectedVal = value), method(value)">
            {{ text }}
          </ae-button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    options: { type: Array, default: null },
    selected: { type: [String, Number], default: '' },
    method: { type: Function, required: true },
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
@use '../../../styles/variables';

.dropdown {
  display: inline-block;
  position: relative;
  min-width: 6rem;
  width: 100%;
  margin-bottom: 22px;
  z-index: 10;

  > div {
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
      color: variables.$color-white;
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
      background: variables.$color-bg-3;
      border: 1px solid variables.$color-blue;
      border-radius: 5px;
      scrollbar-width: none;
    }

    &.show ul.list {
      visibility: visible;
      max-height: 165px;
      overflow-y: scroll;
      position: relative;
    }

    .list-item:hover {
      background: variables.$color-bg-2;
    }
  }

  .dropdown-overlay {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
}
</style>
