<template>
  <button class="primary-button" @click="$emit('click')" :class="getClasses">
    <slot></slot>
  </button>
</template>

<script>
export default {
  props: {
    disabled: Boolean,
    extend: Boolean,
    half: Boolean,
    small: Boolean,
  },
  computed: {
    getClasses() {
      const c = [];
      if (this.disabled) c.push('disabled');
      if (this.extend) c.push('extend');
      if (this.half) c.push('half');
      if (this.small) c.push('small');
      return c.join(' ');
    },
  },
};
</script>

<style lang="scss">
@import '../../../common/variables';

.primary-button {
  background: $button-color !important;
  width: 270px !important;
  border-radius: 5px;
  font-size: 18px;
  padding: 0;
  margin: 8px auto;
  color: $button-text-color !important;
  font-weight: normal !important;
  line-height: 40px !important;
  max-height: 40px;
}
.primary-button span {
  color: $button-text-color !important;
}
.primary-button.disabled {
  opacity: 0.4;
  pointer-events: none;
}
.primary-button.extend {
  // width: 304px !important;
  width: 100% !important;
}
.primary-button.half {
  // width: 148px !important;
  width: 48% !important;
  margin: 0 !important;
}
.primary-button.small {
  width: auto !important;
  line-height: 1px !important;
  padding: 10px;
}
.primary-button.reject,
.primary-button.danger {
  background: $secondary-color !important;
  color: $white-color !important;
}
</style>
