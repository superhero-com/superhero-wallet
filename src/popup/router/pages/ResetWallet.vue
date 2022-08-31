<template>
  <div class="reset-wallet-settings">
    <div class="header">
      {{ $t('pages.reset-wallet-settings.header') }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../../styles/variables';

.reset-wallet-settings {
  padding: 0;
  font-size: 0.95rem;

  .header {
    padding: 0.75rem;
    color: variables.$color-light-grey;
    font-size: 1.05rem;
  }
}
</style>
