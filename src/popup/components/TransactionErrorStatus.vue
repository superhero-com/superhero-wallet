<template>
  <div class="transaction-reverted-status">
    <div class="status-wrapper">
      <div class="text-wrapper">
        <Revert
          v-if="isReverted"
          class="icon"
        />
        <Failed
          v-else
          class="icon"
        />
        {{
          isReverted
            ? $t('pages.transactionDetails.revert')
            : $t('pages.transactionDetails.failed')
        }}
      </div>
    </div>
    <div
      v-if="isReverted"
      class="revert-info"
    >
      {{ $t('pages.transactionDetails.revertInfo') }}
    </div>
  </div>
</template>

<script>
import Revert from '../../icons/refresh.svg?vue-component';
import Failed from '../../icons/warning.svg?vue-component';

export default {
  components: {
    Revert,
    Failed,
  },
  props: {
    returnType: {
      type: String,
      default: '',
    },
  },
  computed: {
    isReverted() {
      return this.returnType === 'revert';
    },
  },
};
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.transaction-reverted-status {
  width: 100%;
  padding: 10px 16px 16px;

  .status-wrapper {
    @extend %face-sans-16-medium;

    @include mixins.flex(center, center);

    letter-spacing: 0.05em;
    color: $color-warning;

    &::before,
    &::after {
      content: '';
      width: 100%;
      height: 1px;
      background: rgba($color-warning, 0.44);
    }

    .icon {
      width: 20px;
      height: 20px;
      margin-right: 2px;
    }

    .text-wrapper {
      @include mixins.flex(center, center);

      margin-inline: 3px;
    }
  }

  .revert-info {
    @extend %face-sans-15-regular;

    line-height: 19px;
    margin-top: 10px;
    color: $color-grey-light;
    text-align: center;
  }
}
</style>
