<template>
  <BtnPlain
    v-clipboard:success="copy"
    v-clipboard:copy="value"
    class="btn-copy"
  >
    <CopyIcon />
    <span
      v-if="copied"
      class="message"
    >{{ message }}</span>
  </BtnPlain>
</template>

<script>
import CopyMixin from '../../../mixins/copy';
import BtnPlain from './BtnPlain.vue';
import CopyIcon from '../../../icons/copy.svg?vue-component';

export default {
  name: 'ButtonCopy',
  components: {
    BtnPlain,
    CopyIcon,
  },
  mixins: [CopyMixin],
  props: {
    value: { type: String, required: true },
    message: { type: String, required: true },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.btn-copy {
  display: inline-flex;
  align-items: center;

  svg {
    width: 24px;
    height: 24px;
    opacity: 0.44;
    color: variables.$color-white;

    &:hover {
      opacity: 1;
      color: variables.$color-green;
    }

    &:active {
      opacity: 0.7;
      color: variables.$color-green;
    }
  }

  span {
    @extend %face-sans-14-regular;

    margin-left: 4px;
    color: variables.$color-blue;
  }
}
</style>
