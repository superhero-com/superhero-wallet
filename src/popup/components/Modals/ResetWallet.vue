<template>
  <Modal
    class="reset-wallet"
    from-bottom
    has-close-button
    centered
    @close="resolve"
  >
    <div class="icon-wrapper">
      <IconBoxed :icon="ResetWalletIcon" />
    </div>
    <div class="info">
      <h3 class="title">
        {{ $t('pages.titles.reset-wallet') }}?
      </h3>
      <div class="text">
        <span>{{ $t('pages.reset-wallet.warning') }}</span>
        <span>{{ $t('pages.reset-wallet.warningConfirm') }}</span>
      </div>
    </div>
    <template #footer>
      <BtnMain
        variant="muted"
        @click="reject"
      >
        {{ $t('common.cancel') }}
      </BtnMain>
      <BtnMain
        variant="danger"
        @click="onReset"
      >
        {{ $t('pages.reset-wallet.reset') }}
      </BtnMain>
    </template>
  </Modal>
</template>

<script>
import { mapActions } from 'vuex';
import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import IconBoxed from '../IconBoxed.vue';
import ResetWalletIcon from '../../../icons/reset-wallet.svg?vue-component';

export default {
  components: {
    Modal,
    BtnMain,
    IconBoxed,
  },
  props: {
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
  },
  setup() {
    return {
      ResetWalletIcon,
    };
  },
  methods: {
    ...mapActions(['reset']),
    async onReset() {
      await this.resolve();
      await this.reset();
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/mixins';
@use '../../../styles/typography';

.reset-wallet {
  .icon-wrapper {
    margin: 8px auto 18px;
    color: variables.$color-danger;
  }

  .info {
    .title {
      color: variables.$color-white;
      padding-bottom: 20px;

      @extend %face-sans-18-medium;
    }

    .text {
      color: rgba(variables.$color-white, 0.85);
      line-height: 20px;
      gap: 10px;

      @extend %face-sans-14-light;

      @include mixins.flex(center, center, column);
    }
  }
}
</style>
