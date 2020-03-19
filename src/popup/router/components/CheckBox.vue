<template>
  <label class="checkbox-container">
    <slot class="checkbox-holder" />
    <input :value="val" v-model="checked" @change="onChange" :type="getType" :name="name" />
    <span class="checkmark" :class="{ checked }" />
  </label>
</template>

<script>
export default {
  props: ['value', 'val', 'type', 'name'],
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
  },
};
</script>

<style lang="scss">
@import '../../../common/variables';
.checkbox-container {
  display: flex;
  position: relative;
  padding-left: 15px;
  height: 20px;
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
    background: no-repeat url('../../../icons/checkbox-unchecked.svg');
    position: absolute;
    top: 0;
    left: 0;
    height: 20px;
    width: 20px;

    &.checked {
      background-image: url('../../../icons/checkbox-checked.svg');
    }
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
