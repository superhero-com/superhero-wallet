<template>
  <button
    v-clipboard:success="copy"
    v-clipboard:copy="value"
    class="copy-button"
  >
    <CopyIcon />
    <span
      v-if="copied"
      class="message"
    >{{ message }}</span>
  </button>
</template>

<script>
import CopyIcon from '../../../icons/copy.svg?vue-component';

export default {
  name: 'CopyButton',
  components: { CopyIcon },
  props: {
    value: { type: String, required: true },
    message: { type: String, required: true },
  },
  data: () => ({ copied: false }),
  methods: {
    copy() {
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 3000);
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.copy-button {
  padding: 0;
  display: inline-flex;
  align-items: center;
  cursor: pointer;

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
