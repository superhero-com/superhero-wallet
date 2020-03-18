<template>
  <label class="checkbox-container">
    <slot class="checkbox-holder"></slot>
    <input :value="val" v-model="checked" @change="onChange" type="checkbox" />
    <span
      class="checkmark"
      :style="{ 'background-image': `url(${checked ? checkboxChecked : checkboxUnchecked})` }"
    ></span>
  </label>
</template>

<script>
export default {
  props: ['value', 'val'],
  data() {
    return {
      checkedProxy: false,
      checkboxUnchecked: browser.runtime.getURL('../icons/checkbox-unchecked.svg'),
      checkboxChecked: browser.runtime.getURL('../icons/checkbox-checked.svg'),
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
  },
  methods: {
    onChange(e) {
      this.$emit('input', this.checkedProxy);
    },
  },
};
</script>

<style lang="scss">
@import '../../../common/variables';
.checkbox-container {
  display: flex;
  position: relative;
  padding-left: 15px;
  margin-bottom: 2rem;
  cursor: pointer;
  justify-content: space-around;
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
    background: no-repeat;
    position: absolute;
    top: 0;
    left: 0;
    height: 20px;
    width: 20px;
  }
}
.checkbox-holder {
  position: relative;
  margin: 0px 10px;
}
.termsCheck {
  margin-bottom: 20px;
}
</style>
