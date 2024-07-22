<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="not-found">
        <img
          class="image"
          :src="NotFoundImage"
          alt="Feature not found"
        >
        <div class="text-heading-1 heading">
          {{ $t('pages.notFound.header') }}
        </div>
        <div class="text-description description">
          {{ $t('pages.notFound.description') }}
        </div>

        <div class="button-wrapper">
          <BtnMain
            v-if="!hideHomeButton"
            class="button"
            :to="{ name: 'index' }"
          >
            {{ $t('pages.notFound.backToHome') }}
          </BtnMain>
          <BtnMain
            class="button"
            :href="BUG_REPORT_URL"
            variant="muted"
          >
            <BugIcon class="icon" />
            {{ $t('pages.notFound.reportBug') }}
          </BtnMain>
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IonContent, IonPage } from '@ionic/vue';
import { BUG_REPORT_URL } from '@/constants';

import BtnMain from '../components/buttons/BtnMain.vue';
import NotFoundImage from '../../image/not-found.webp';
import BugIcon from '../../icons/bug.svg?vue-component';

export default defineComponent({
  components: {
    BtnMain,
    BugIcon,
    IonPage,
    IonContent,
  },
  props: {
    hideHomeButton: Boolean,
  },
  setup() {
    return {
      NotFoundImage,
      BUG_REPORT_URL,
    };
  },
});

</script>

<style lang="scss" scoped>
@use '@/styles/typography';

.not-found {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: auto;
  padding: 0 16px;

  .image {
    margin-top: 88px;
    width: 156px;
  }

  .heading {
    margin-top: 16px;
  }

  .description {
    margin-top: 8px;
  }

  .button-wrapper {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 32px;
    width: 100%;

    .button {
      width: 100%;
    }

    .icon {
      margin-right: 4px;
      width: 20px;
      height: 20px;
    }
  }
}
</style>
