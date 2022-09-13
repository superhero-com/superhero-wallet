<template>
  <div class="reset-wallet-settings">
    <div class="description">
      {{ $t('pages.reset-wallet.description') }}
    </div>
    <i18n
      path="pages.reset-wallet.description2"
      tag="div"
      class="description"
    >
      <RouterLink :to="{ name: 'settings-seed-phrase' }">
        seed phrase
      </RouterLink>
    </i18n>

    <BtnMain
      variant="pink"
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
import ResetWallet from '../../../icons/reset-wallet.svg?vue-component';
import { MODAL_RESET_WALLET } from '../../utils/constants';

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
  @use '../../../styles/variables';
  @use '../../../styles/typography';

  .reset-wallet-settings {
    padding: 16px;

    .description {
      color: rgba(variables.$color-white, 0.75);
      padding: 6px 8px 2px 0;
      line-height: 20px;
      text-align: left;
      white-space: pre-line;

      a {
        color: variables.$color-primary;
        text-decoration: none;
      }

      @extend %face-sans-14-light;
    }

    .reset-wallet-button {
      margin-top: 34px;
    }
  }

</style>
