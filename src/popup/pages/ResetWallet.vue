<template>
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
        seed phrase
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
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { MODAL_RESET_WALLET } from '../utils/constants';
import { useModals } from '../../composables';
import BtnMain from '../components/buttons/BtnMain.vue';
import ResetWalletIcon from '../../icons/reset-wallet.svg?vue-component';

export default defineComponent({
  components: {
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
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.reset-wallet-settings {
  padding: var(--screen-padding-x);

  .reset-wallet-button {
    margin-top: 34px;
  }
}
</style>
