<template>
  <ButtonPlain
    v-clipboard:success="copy"
    v-clipboard:copy="value"
    class="copy-button"
  >
    <CopyIcon />
    <span
      v-if="copied"
      class="message"
    >{{ message }}</span>
  </ButtonPlain>
</template>

<script>
import CopyMixin from '../../../mixins/copy';
import ButtonPlain from './ButtonPlain.vue';
import CopyIcon from '../../../icons/copy.svg?vue-component';

export default {
  name: 'CopyButton',
  components: { ButtonPlain, CopyIcon },
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

.copy-button {
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
    margin-left: 4px;

    @extend %face-sans-14-regular;

    color: variables.$color-blue;
  }
}
</style>
