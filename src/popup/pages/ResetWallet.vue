<template>
  <div class="reset-wallet-settings">
    <p class="text-description">
      {{ $t('pages.reset-wallet.description') }}
    </p>
    <i18n-t
      keypath="pages.reset-wallet.description2"
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
      :text="$t('pages.titles.reset-wallet')"
      :icon="ResetWalletIcon"
      @click="onResetWallet"
    />
  </div>
</template>

<script>
import BtnMain from '../components/buttons/BtnMain.vue';
import ResetWalletIcon from '../../icons/reset-wallet.svg?vue-component';
import { MODAL_RESET_WALLET } from '../utils/constants';

export default {
  components: {
    BtnMain,
  },
  data: () => ({
    ResetWalletIcon,
  }),
  methods: {
    onResetWallet() {
      this.$store.dispatch('modals/open', {
        name: MODAL_RESET_WALLET,
      });
    },
  },
};
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
