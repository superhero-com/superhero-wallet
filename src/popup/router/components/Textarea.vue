<template>
  <textarea
    class="textarea"
    :placeholder="placeholder"
    :class="{ error: error || err, [size]: size }"
    :value="value"
    data-cy="textarea"
    @input="$emit('input', $event.target.value)"
  />
</template>

<script>
import { checkAddress, checkAensName } from '../../utils/helper';

export default {
  props: {
    type: { type: String, default: '' },
    value: { type: String, default: '' },
    error: Boolean,
    placeholder: { type: String, default: '' },
    size: { type: String, default: '' },
  },
  data: () => ({ err: false }),
  watch: {
    value(val) {
      if (this.type === 'address') {
        this.err = !checkAddress(val) && !checkAensName(val);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.textarea {
  outline: none;
  resize: none;
  border: none;
  display: block;
  width: 100%;
  border-radius: 5px;
  background: variables.$color-bg-2;
  padding: 15px;
  margin-bottom: 22px;
  color: variables.$color-white;

  @extend %face-sans-16-regular;

  height: 200px;
  margin-left: auto;
  margin-right: auto;
  word-break: break-word;

  &:focus {
    border-color: variables.$color-blue;
  }

  &.error {
    border-color: variables.$color-error;
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
