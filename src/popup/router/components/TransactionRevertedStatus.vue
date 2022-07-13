<template>
  <div class="transaction-reverted-status">
    <div class="status-wrapper">
      <div class="text-wrapper">
        <Revert class="revert-icon" />
        {{
          $te(`pages.transactionDetails.${returnType}`)
            ? $t(`pages.transactionDetails.${returnType}`)
            : returnType
        }}
      </div>
    </div>
    <div
      v-if="returnType === 'revert'"
      class="revert-info"
    >
      {{ $t('pages.transactionDetails.revertInfo') }}
    </div>
  </div>
</template>

<script>
import Revert from '../../../icons/revert.svg?vue-component';

export default {
  components: {
    Revert,
  },
  props: {
    returnType: {
      type: String,
      default: '',
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.transaction-reverted-status {
  width: 100%;
  padding: 10px 16px 16px;

  .status-wrapper {
    @extend %face-sans-16-medium;

    @include mixins.flex(center, center);

    letter-spacing: 0.05em;
    color: variables.$color-warning;

    &::before,
    &::after {
      content: '';
      width: 100%;
      height: 2px;
      background: rgba(variables.$color-warning, 0.44);
    }

    .revert-icon {
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
    @extend %face-sans-14-regular;

    line-height: 19px;
    margin-top: 10px;
    color: variables.$color-light-grey;
    text-align: center;
  }
}
</style>
