<template>
  <textarea
    class="textarea"
    :placeholder="placeholder"
    :class="{ 'has-error': error || err, [size]: size }"
    :value="value"
    @input="$emit('input', $event.target.value)"
    data-cy="textarea"
  />
</template>

<script>
import { checkAddress, chekAensName } from '../../utils/helper';

export default {
  props: {
    type: String,
    value: String,
    error: Boolean,
    placeholder: String,
    size: String,
  },
  data: () => ({ err: false }),
  watch: {
    value(val) {
      if (this.type === 'address') {
        this.err = !checkAddress(val) && !chekAensName(val);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.textarea {
  display: block;
  width: 100%;
  border-radius: 5px;
  border: 2px solid $border-color;
  background: $input-bg-color;
  padding: 15px;
  margin-bottom: 22px;
  color: $text-color;
  font-family: 'Roboto', sans-serif;
  font-size: $font-size;
  min-height: 200px;
  margin-left: auto;
  margin-right: auto;
  word-break: break-word;

  &:focus {
    border-color: $input-focus-color;
  }

  &.has-error {
    border-color: $input-error-color;
  }

  &.sm {
    font-size: 15px;
  }

  &.h-50 {
    min-height: 100px;
  }

  &.medium {
    font-size: 15px;
    min-height: 150px;
  }
}
</style>
