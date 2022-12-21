<template>
  <div class="reset-wallet-settings">
    <p class="text-description">
      {{ $t('pages.reset-wallet.description') }}
    </p>
    <i18n
      path="pages.reset-wallet.description2"
      tag="p"
      class="text-description"
    >
      <RouterLink :to="{ name: 'settings-seed-phrase' }">
        seed phrase
      </RouterLink>
    </i18n>

    <BtnMain
      variant="danger"
      class="reset-wallet-button"
      has-icon
      extend
      @click="onResetWallet"
    >
      <ResetWallet />
      {{ $t('pages.titles.reset-wallet') }}
    </BtnMain>
  </div>
</template>

<script>
import BtnMain from '../components/buttons/BtnMain.vue';
import ResetWallet from '../../icons/reset-wallet.svg?vue-component';
import { MODAL_RESET_WALLET } from '../utils/constants';

export default {
  components: {
    BtnMain,
    ResetWallet,
  },
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
