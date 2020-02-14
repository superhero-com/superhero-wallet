<template>
  <textarea class="textarea" :placeholder="placeholder ? placeholder : ''" :class="getClasses" :value="value" @input="$emit('input', $event.target.value)" />
</template>

<script>
export default {
  props: ['value', 'error', 'placeholder', 'size'],
  computed: {
    getClasses() {
      let cl = [];
      if (this.error || this.err) {
        cl.push('has-error');
      }
      if (this.size) {
        cl = [...cl, ...this.size.split(' ')];
      }
      return cl;
    },
  },
};
</script>

<style lang="scss">
@import '../../../common/variables';

textarea {
  display: block;
  width: 100%;
  border-radius: 5px;
  border: 2px solid $border-color !important;
  background: $input-bg-color !important;
  padding: 15px;
  margin-bottom: 22px;
  color: $text-color !important;
  font-size: $font-size;
  min-height: 200px !important;
  margin-left: auto;
  margin-right: auto;
  word-break: break-word;
}
textarea:focus {
  border-color: $accent-color !important;
}
textarea.has-error {
  border-color: $secondary-color !important;
}
textarea.sm {
  font-size: 14px;
}
textarea.h-50 {
  min-height: 100px !important;
}
</style>
