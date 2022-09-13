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
    <BtnMain
      class="button"
      extend
      :to="{ name: 'settings-seed-phrase-details' }"
    >
      {{ $t('pages.seed-phrase-settings.seedRecoveryBtn') }}
    </BtnMain>
  </div>
</template>

<script>
import BtnMain from '../components/buttons/BtnMain.vue';

export default {
  components: { BtnMain },
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
    margin-top: 48px;
  }

  .verified {
    text-align: center;
  }
}
</style>
