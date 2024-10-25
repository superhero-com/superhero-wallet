<template>
  <IonPage class="page-wrapper ion-padding ion-content-bg">
    <IonHeader
      v-if="!hideHeader"
      id="header"
      class="page-wrapper-header ion-no-border"
    >
      <IonToolbar class="toolbar">
        <slot name="header">
          <PageHeader :text="pageTitle" />
        </slot>
      </IonToolbar>
    </IonHeader>

    <component
      :is="(hasSubContent) ? 'div' : 'IonContent'"
      ref="contentEl"
      :class="{
        'has-header': !hideHeader,
        'has-sub-content': hasSubContent,
      }"
      class="page-wrapper-content"
    >
      <slot v-bind="{ contentEl, pageDidEnter }" />
    </component>
  </IonPage>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
} from '@ionic/vue';

import PageHeader from './Header.vue';

export default defineComponent({
  name: 'AccountDetailsBase',
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonToolbar,
    PageHeader,
  },
  props: {
    pageTitle: { type: String, default: null },
    /** Set to true if the page itself has IonContent as a child */
    hasSubContent: Boolean,
    hideHeader: Boolean,
    pageDidEnter: Boolean,
  },
  setup() {
    const contentEl = ref();

    return {
      contentEl,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.page-wrapper {
  &::part(scroll) {
    height: 100%;
  }

  .has-header {
    &::part(scroll) {
      --padding-top: calc(#{$header-default-height} + env(safe-area-inset-top));
    }
  }

  .page-wrapper-content {
    min-height: 100%;

    &.has-header.has-sub-content {
      padding-top: calc(#{$header-default-height} + env(safe-area-inset-top));
    }
  }

  .page-wrapper-header {
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
