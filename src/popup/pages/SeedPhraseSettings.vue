<template>
  <ion-page>
    <ion-content
      class="ion-padding"
    >
      <div class="seed-phrase-settings">
        <i18n-t
          keypath="pages.seed-phrase-settings.seedRecoverySmall"
          tag="p"
          class="text-description"
          scope="global"
        />
        <i18n-t
          keypath="pages.seed-phrase-settings.seedRecoverySmall-2"
          tag="p"
          class="text-description"
          scope="global"
        />
        <i18n-t
          keypath="pages.seed-phrase-settings.seedRecoverySmall-3"
          tag="p"
          class="text-description"
          scope="global"
        >
          <strong>
            {{ $t('pages.seed-phrase-settings.seedRecoverySmallBackItUp') }}
          </strong>
        </i18n-t>
        <i18n-t
          keypath="pages.seed-phrase-settings.seedRecoverySmall-4"
          tag="p"
          class="text-description"
          scope="global"
        />
        <BtnMain
          class="button"
          extend
          :to="{ name: 'settings-seed-phrase-details' }"
        >
          {{ $t('pages.seed-phrase-settings.seedRecoveryBtn') }}
        </BtnMain>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { IonPage, IonContent } from '@ionic/vue';
import BtnMain from '../components/buttons/BtnMain.vue';

export default {
  components: { BtnMain, IonPage, IonContent },
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
