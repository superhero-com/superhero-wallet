<template>
  <div class="errors-log-settings">
    <div class="header">
      {{ $t('pages.errors-log-settings.header') }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../../styles/variables';

.errors-log-settings {
  padding: 0;
  font-size: 0.95rem;

  .header {
    padding: 0.75rem;
    color: variables.$color-light-grey;
    font-size: 1.05rem;
  }
}
</style>
