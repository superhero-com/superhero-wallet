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
      <span class="text">{{ $t('addressCopied') }}</span>
      <div class="line" />
    </div>
    <span
      v-else
      class="address"
    >{{ value }}</span>
  </div>
</template>

<script>
export default {
  props: {
    value: { type: String, required: true },
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

.copy-address {
  .address {
    @extend %face-sans-11-regular;

    color: variables.$color-light-grey;
    word-break: break-all;
    cursor: pointer;
    display: block;

    &:hover {
      color: variables.$color-white;
    }
  }

  .copied {
    height: 100%;
    display: flex;

    .text {
      flex: 1;
      display: flex;
      align-items: center;
      padding: 0 8px;
      font-size: 14px;
      line-height: 16px;
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
