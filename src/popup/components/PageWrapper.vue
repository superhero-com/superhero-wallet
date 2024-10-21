<template>
  <component
    :is="hasSubPages ? 'div' : 'IonPage'"
    class="page-wrapper ion-padding ion-content-bg"
  >
    <IonHeader
      v-if="!hideHeader"
      id="header"
      class="header ion-no-border"
    >
      <IonToolbar class="toolbar">
        <slot name="header">
          <PageHeader :text="pageTitle" />
        </slot>
      </IonToolbar>
    </IonHeader>

    <component
      :is="hasSubPages ? 'div' : 'IonContent'"
      :class="{ 'has-header': !hideHeader }"
      class="page-wrapper-content"
    >
      <slot />
    </component>
  </component>
</template>

<script lang="ts">
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
} from '@ionic/vue';
import { defineComponent } from 'vue';

import PageHeader from './Header.vue';

export default defineComponent({
  name: 'PageWrapper',
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonToolbar,
    PageHeader,
  },
  props: {
    pageTitle: { type: String, default: null },
    hasSubPages: Boolean,
    hideHeader: Boolean,
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.page-wrapper {
  ion-content.has-header {
    &::part(scroll) {
      --padding-top: calc(#{$header-default-height} + env(safe-area-inset-top));
    }
  }

  .header {
    position: fixed;
    z-index: $z-index-header;
    padding-top: env(safe-area-inset-top);
    background-color: rgba($color-bg-app, 0.8);
    backdrop-filter: blur($bg-blur-radius);

    .toolbar {
      --opacity: 0;
      --min-height: 0;
      --padding-top: 0;
      --padding-bottom: 0;
      --padding-start: 0;
      --padding-end: 0;
    }
  }
}
</style>
