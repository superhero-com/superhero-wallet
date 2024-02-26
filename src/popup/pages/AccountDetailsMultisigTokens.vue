<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg--lighter">
      <div class="multisig-token-list-wrapper">
        <AssetList
          :search-term="searchPhrase"
          is-multisig
        />
      </div>
      <BackToTop />
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { IonContent, IonPage } from '@ionic/vue';
import { defineComponent } from 'vue';
import { useTransactionAndTokenFilter } from '@/composables';

import AssetList from '../components/Assets/AssetList.vue';
import BackToTop from '../components/BackToTop.vue';

export default defineComponent({
  components: {
    AssetList,
    IonPage,
    IonContent,
    BackToTop,
  },
  props: {
    showFilters: Boolean,
  },
  setup() {
    const { searchPhrase } = useTransactionAndTokenFilter();

    return {
      searchPhrase,
    };
  },
});
</script>

<style lang="scss" scoped>
.multisig-token-list-wrapper {
  position: relative;
  padding-top: 4px;
}
</style>
