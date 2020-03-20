<template>
  <div class="text-left" :class="labelPosition ? 'input-group' : ''">
    <label class="label" v-if="label" :class="labelPosition ? `label-${labelPosition}` : ''">{{ label }}</label>
    <input
      type="text"
      class="input"
      :placeholder="placeholder ? placeholder : ''"
      :class="getClasses"
      :value="value"
      @input="$emit('input', $event.target.value)"
      :data-cy="type ? `input-${type}` : 'input'"
    />
  </div>
</template>

<script>
export default {
  props: ['value', 'error', 'placeholder', 'size', 'type', 'label', 'labelPosition'],
  data: () => ({ err: false }),
  created() {},
  watch: {
    value(val) {
      if ((this.type === 'number' && isNaN(val)) || parseFloat(val) === 0) {
        this.err = true;
      } else {
        this.err = false;
      }
    },
  },
  computed: {
    getClasses() {
      let cl = [];
      if (this.error || this.err) {
        cl.push('has-error');
      }
      if (this.size) {
        cl = [...cl, ...this.size.split(' ')];
      }
      if (this.labelPosition) {
        cl.push('input-label');
      }
      return cl;
    },
  },
};
</script>

<style lang="scss">
@import '../../../common/variables';

input.input {
  display: block;
  width: 100%;
  border-radius: 5px;
  border: 2px solid $border-color !important;
  background: $input-bg-color !important;
  padding: 10px;
  margin-bottom: 22px;
  color: $text-color !important;
  font-size: 14px;
  min-height: 35px;
  margin-left: auto;
  margin-right: auto;
}
.input:focus {
  border-color: $accent-color !important;
}
.input.has-error {
  border-color: $secondary-color !important;
}
.input.sm {
  font-size: 14px;
}
.input.xsm {
  font-size: 11px;
}
.input.big {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0;
  height: auto;
  width: 180px;
  margin-right: 15px;
  padding: 3px 10px;
}
.input.m-0 {
  margin: 0 !important;
}
.label {
  font-size: 14px;
  margin: 4px 0;
  display: block;
  font-weight: normal;
}
.input-group {
  width: 80%;
  position: relative;
  display: inline-block;
  margin: 8px auto;
  .input {
    padding-right: 50px;
    margin-bottom: 0;
  }
}
.label-right {
  position: absolute;
  right: 9px;
  margin: 0;
  top: 17px;
  transform: translateY(-50%);
  -ms-transform: translateY(-50%);
  -webkit-transform: translateY(-50%);
  opacity: 0.6;
}
</style>
