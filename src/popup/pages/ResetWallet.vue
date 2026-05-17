<template>
  <PageWrapper
    :page-title="$t('pages.resetWallet.title')"
  >
    <div class="reset-wallet-settings">
      <p
        class="text-description"
        v-text="$t('pages.resetWallet.description')"
      />

      <i18n-t
        keypath="pages.resetWallet.description2"
        tag="p"
        class="text-description"
        scope="global"
      >
        <RouterLink :to="{ name: ROUTE_SEED_PHRASE_SETTINGS }">
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
  </PageWrapper>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { MODAL_RESET_WALLET } from '@/constants';
import { ROUTE_ADDRESS_BOOK, ROUTE_SEED_PHRASE_SETTINGS } from '@/popup/router/routeNames';
import { useModals } from '@/composables';

import PageWrapper from '@/popup/components/PageWrapper.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';

import ResetWalletIcon from '@/icons/reset-wallet.svg?vue-component';

export default defineComponent({
  components: {
    PageWrapper,
    BtnMain,
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
      ROUTE_SEED_PHRASE_SETTINGS,
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
