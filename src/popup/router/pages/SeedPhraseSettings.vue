<template>
  <div class="seed-phrase-settings">
    <i18n
      path="pages.seed-phrase-settings.seedRecoverySmall"
      tag="div"
      class="description"
    >
      <span class="white-text">
        {{ $t('pages.seed-phrase-settings.seedRecoverySmallBackItUp') }}
      </span>
    </i18n>
    <Button
      class="show"
      :to="{ name: 'settings-seed-phrase-details' }"
    >
      {{ $t('pages.seed-phrase-settings.seedRecoveryBtn') }}
    </Button>
  </div>
</template>

<script>
import Button from '../components/Button.vue';

export default {
  components: { Button },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.seed-phrase-settings {
  padding: 16px;

  .description {
    color: rgba(variables.$color-white, 0.75);
    line-height: 20px;
    white-space: pre-line;

    .white-text {
      color: variables.$color-white;
    }

    @extend %face-sans-14-light;
  }

  .button {
    width: 100%;
    margin-top: 48px;
    text-align: center;
  }

  .verified {
    text-align: center;
  }
}
</style>
