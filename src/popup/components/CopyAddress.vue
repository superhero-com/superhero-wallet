<template>
  <div
    v-clipboard:copy="value"
    v-clipboard:success="copy"
    class="copy-address"
  >
    <div
      v-if="copied"
      class="copied"
    >
      <div class="line" />
      <span class="text">{{ customText || $t('addressCopied') }}</span>
      <div class="line" />
    </div>
    <span
      v-else
      class="address"
    >{{ address }}</span>
  </div>
</template>

<script>
import CopyMixin from '../../mixins/copy';
import { chunkString } from '../utils/utils';

export default {
  mixins: [CopyMixin],
  props: {
    value: { type: String, required: true },
    customText: { type: String, default: '' },
    letterSpacing: { type: Boolean },
  },
  computed: {
    address() {
      if (this.letterSpacing && this.value.includes('ak_')) {
        return chunkString(this.value, 3).join(' ');
      }

      return this.value;
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.copy-address {
  .address {
    @extend %face-sans-12-medium;

    display: block;
    letter-spacing: 0.05em;
    word-spacing: 3px;
    line-height: 18px;
    color: variables.$color-light-grey;
    word-break: break-all;
    cursor: pointer;

    &:hover {
      color: variables.$color-white;
    }
  }

  .copied {
    height: 100%;
    display: flex;

    .text {
      flex: 2;
      display: flex;
      align-items: center;
      padding: 0 8px;
      font-size: 14px;
      line-height: 18px;
      color: variables.$color-blue;
      text-align: center;
      user-select: none;
    }

    .line {
      flex: 1;
      height: 50%;
      border-bottom: 1px dashed variables.$color-blue;
    }
  }
}
</style>
