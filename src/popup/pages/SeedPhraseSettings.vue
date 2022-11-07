<template>
  <div class="seed-phrase-settings">
    <i18n
      path="pages.seed-phrase-settings.seedRecoverySmall"
      tag="div"
      class="description"
    />
    <i18n
      path="pages.seed-phrase-settings.seedRecoverySmall-2"
      tag="div"
      class="description"
    />
    <i18n
      path="pages.seed-phrase-settings.seedRecoverySmall-3"
      tag="div"
      class="description"
    >
      <span class="white-text">
        {{ $t('pages.seed-phrase-settings.seedRecoverySmallBackItUp') }}
      </span>
    </i18n>
    <i18n
      path="pages.seed-phrase-settings.seedRecoverySmall-4"
      tag="div"
      class="description"
    />
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
@use '../../styles/variables';
@use '../../styles/typography';

.seed-phrase-settings {
  padding: 16px;

  .description {
    @extend %face-sans-15-regular;

    color: rgba(variables.$color-white, 0.75);
    line-height: 22px;
    padding-top: 8px;

    .white-text {
      color: variables.$color-white;
    }

    &:first-of-type {
      padding-top: 18px;
    }
  }

  .button {
    margin-top: 22px;
  }
}
</style>
