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
        this.err = !checkAddress(val) && !checkAensName(val);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/typography';

.textarea {
  display: block;
  width: 100%;
  border-radius: 5px;
  background: $color-bg-2;
  padding: 15px;
  margin-bottom: 22px;
  color: $color-white;

  @extend %face-sans-16-regular;

  min-height: 200px;
  margin-left: auto;
  margin-right: auto;
  word-break: break-word;

  &:focus {
    border-color: $color-blue;
  }

  &.error {
    border-color: $color-error;
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
