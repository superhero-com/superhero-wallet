<template>
  <ae-check :value="val" v-model="checked" @change="onChange" type="checkbox">
    <slot class="checkbox-holder"></slot>
  </ae-check>
</template>

<script>
export default {
  props: ['value', 'val'],
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
.checkbox-holder {
  position: relative;
  margin: 0px 10px;
}
.termsCheck {
  margin-bottom: 20px;
}
</style>
