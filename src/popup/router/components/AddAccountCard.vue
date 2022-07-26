<template>
  <div class="add-account-card">
    <div class="title">
      <PlusCircle />
      {{ $t('pages.accounts.add-account') }}
    </div>
    <div class="description">
      {{ $t('pages.accounts.add-account-description') }}
    </div>
  </div>
</template>

<script>
import PlusCircle from '../../../icons/plus-circle-fill.svg?vue-component';

export default {
  components: { PlusCircle },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.add-account-card {
  width: 100%;
  height: 169px;
  border-radius: 16px;
  background: variables.$color-green-dark;
  padding: 16px;

  .title {
    display: inline-flex;
    align-items: center;
    padding-bottom: 12px;
    color: variables.$color-white;

    @extend %face-sans-20-regular;

    svg {
      width: 40px;
      height: 40px;
      margin-right: 12px;
    }
  }

  .description {
    text-align: center;
    padding: 0 16px;
    color: rgba(variables.$color-white, 0.85);

    @extend %face-sans-16-regular;
  }
}
</style>
