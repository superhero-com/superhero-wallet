<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="reset-wallet-settings">
        <p class="text-description">
          {{ $t('pages.resetWallet.description') }}
        </p>
        <i18n-t
          keypath="pages.resetWallet.description2"
          tag="p"
          class="text-description"
          scope="global"
        >
          <RouterLink :to="{ name: 'settings-seed-phrase' }">
            {{ $t('pages.resetWallet.seedPhrase') }}
          </RouterLink>
          <RouterLink :to="{ name: ROUTE_ADDRESS_BOOK }">
            {{ $t('pages.resetWallet.addressBook') }}
          </RouterLink>
        </i18n-t>

        <BtnMain
          variant="danger"
          class="reset-wallet-button"
          extend
          :text="$t('pages.resetWallet.title')"
          :icon="ResetWalletIcon"
          @click="onResetWallet"
        />
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IonPage, IonContent } from '@ionic/vue';

import { MODAL_RESET_WALLET } from '@/constants';
import { ROUTE_ADDRESS_BOOK } from '@/popup/router/routeNames';
import { useModals } from '@/composables';

import BtnMain from '@/popup/components/buttons/BtnMain.vue';

import ResetWalletIcon from '@/icons/reset-wallet.svg?vue-component';

export default defineComponent({
  components: {
    BtnMain,
    IonPage,
    IonContent,
  },
  setup() {
    const { openModal } = useModals();

    function onResetWallet() {
      openModal(MODAL_RESET_WALLET);
    }

    return {
      ResetWalletIcon,
      onResetWallet,
      ROUTE_ADDRESS_BOOK,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.reset-wallet-settings {
  padding-inline: var(--screen-padding-x);

  .reset-wallet-button {
    margin-top: 34px;
  }
}
</style>
