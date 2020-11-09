<template>
  <label class="checkbox-container" @click.stop="handleClick">
    <input
      :disabled="disabled"
      :value="val"
      v-model="checked"
      @change="onChange"
      :type="getType"
      :name="name"
    />
    <span class="checkmark" :class="{ checked, disabled }" />
    <slot class="checkbox-holder" />
  </label>
</template>

<script>
export default {
  props: {
    value: [String, Number, Boolean],
    val: [String, Number, Boolean],
    type: String,
    name: String,
    prevent: Boolean,
    disabled: Boolean,
  },
  data() {
    return {
      checkedProxy: false,
    };
  },
  computed: {
    checked: {
      get() {
        return this.value;
      },
      set(val) {
        this.checkedProxy = val;
      },
    },
    getType() {
      return !this.type ? 'checkbox' : this.type;
    },
  },
  methods: {
    onChange() {
      this.$emit('input', this.checkedProxy);
    },
    handleClick(e) {
      if (this.prevent) e.preventDefault();
    },
  },
};
</script>

<style lang="scss">
@import '../../../common/variables';

.checkbox-container {
  display: flex;
  position: relative;
  height: 20px;
  cursor: pointer;
  justify-content: start;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;

  input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }

  .checkmark {
    background-color: #272831;
    border: 1.3px solid $border-track-color;
    border-radius: 2px;
    height: 20px;
    width: 20px;
    margin-right: 15px;

    &.checked {
      background-image: url('../../../icons/checkbox-checked.svg');

      &.disabled {
        filter: brightness(0.8);
      }
    }
  }

  .checkbox-holder {
    position: relative;
    margin: 0 10px;
  }
}
</style>
