<template>
  <div class="seed-phrase-settings">
    <i18n
      path="pages.seed-phrase-settings.seedRecoverySmall"
      tag="p"
      class="text-description"
    />
    <i18n
      path="pages.seed-phrase-settings.seedRecoverySmall-2"
      tag="p"
      class="text-description"
    />
    <i18n
      path="pages.seed-phrase-settings.seedRecoverySmall-3"
      tag="p"
      class="text-description"
    >
      <strong>
        {{ $t('pages.seed-phrase-settings.seedRecoverySmallBackItUp') }}
      </strong>
    </i18n>
    <i18n
      path="pages.seed-phrase-settings.seedRecoverySmall-4"
      tag="p"
      class="text-description"
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
  padding: var(--screen-padding-x);

  .white-text {
    color: variables.$color-white;
  }

  .button {
    margin-top: 22px;
  }
}
</style>
