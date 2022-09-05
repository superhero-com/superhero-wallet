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

    <Button
      class="reset-wallet-button"
      @click="onResetWallet"
    >
      <div class="box">
        <ResetWallet />
        {{ $t('pages.titles.reset-wallet') }}
      </div>
    </Button>
  </div>
</template>

<script>
import Button from '../components/Button.vue';
import ResetWallet from '../../../icons/reset-wallet.svg?vue-component';
import { MODAL_RESET_WALLET } from '../../utils/constants';

export default {
  components: { Button, ResetWallet },
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
      width: 100%;
      background-color: rgba(variables.$color-red-2, 0.15);
      border: 1px solid rgba(variables.$color-red-2, 0.44);
      color: variables.$color-red-2;
      margin-top: 34px;

      &,
      .box {
        display: inline-flex;
        justify-content: space-around;
        align-items: center;
      }

      &:hover {
        background-color: rgba(variables.$color-red-2, 0.15);
        border-color: rgba(variables.$color-red-2, 1);
      }

      .reset-wallet {
        width: 25px;
        height: 24px;
        margin-right: 4px;
      }
    }
  }

</style>
