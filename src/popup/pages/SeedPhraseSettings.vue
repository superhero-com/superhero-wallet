<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
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
        />
        <i18n-t
          keypath="pages.seed-phrase-settings.seedRecoverySmall-4"
          tag="p"
          class="text-description"
          scope="global"
        >
          <strong>
            {{ $t('pages.seed-phrase-settings.seedRecoverySmallBackItUp') }}
          </strong>
        </i18n-t>
        <p class="text-description">
          <strong>
            {{ $t('pages.seed-phrase-settings.seedRecoverySmall-5') }}
          </strong>
        </p>
        <BtnMain
          class="button"
          extend
          :to="{ name: ROUTE_SEED_PHRASE_DETAILS }"
        >
          {{ $t('pages.seed-phrase-settings.seedRecoveryBtn') }}
        </BtnMain>
      </div>
    </IonContent>
  </IonPage>
</template>

<script>
import { defineComponent } from 'vue';
import { IonPage, IonContent } from '@ionic/vue';
import { ROUTE_SEED_PHRASE_DETAILS } from '@/popup/router/routeNames';

import BtnMain from '../components/buttons/BtnMain.vue';

export default defineComponent({
  components: {
    BtnMain,
    IonPage,
    IonContent,
  },
  setup() {
    return {
      ROUTE_SEED_PHRASE_DETAILS,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.seed-phrase-settings {
  padding-inline: var(--screen-padding-x);

  .white-text {
    color: $color-white;
  }

  .button {
    margin-top: 22px;
  }
}
</style>
