<template>
  <Modal
    class="reset-wallet"
    from-bottom
    has-close-button
    full-screen
    no-blur
    @close="resolve"
  >
    <div class="icon-wrapper">
      <ResetWallet />
    </div>
    <div class="info">
      <h3 class="title">
        {{ $t('pages.titles.reset-wallet') }}?
      </h3>
      <div class="description">
        {{ $t('pages.reset-wallet.warning') }}
      </div>
      <div class="warning">
        {{ $t('pages.reset-wallet.warningConfirm') }}
      </div>
    </div>
    <div class="buttons">
      <Button
        class="cancel-button"
        @click="reject"
      >
        {{ $t('pages.reset-wallet.cancel') }}
      </Button>
      <Button
        class="reset-button"
        @click="onReset"
      >
        {{ $t('pages.reset-wallet.reset') }}
      </Button>
    </div>
  </Modal>
</template>

<script>
import { mapActions } from 'vuex';
import Modal from '../Modal.vue';
import Button from '../Button.vue';
import ResetWallet from '../../../../icons/reset-wallet.svg?vue-component';

export default {
  components: {
    Modal,
    Button,
    ResetWallet,
  },
  props: {
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
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
@use '../../../../styles/variables';
@use '../../../../styles/mixins';
@use '../../../../styles/typography';

.reset-wallet {
  ::v-deep .container {
    top: 28%;
    text-align: center;
    border-radius: 16px;

    .close-button {
      top: 2px;
      right: 2px;

      .icon {
        color: rgba(variables.$color-white, 0.5);
      }
    }
  }

  .icon-wrapper {
    margin: 8px auto 18px;
    width: 64px;
    height: 64px;
    background-color: variables.$color-bg-1;
    border: 4px solid rgba(variables.$color-white, 0.05);
    border-radius: 32px;
    display: inline-flex;
    justify-content: space-around;
    align-items: center;

    .reset-wallet {
      width: 48px;
      height: 48px;
      color: variables.$color-red-2;
    }
  }

  .info {
    padding-bottom: 24px;

    .title {
      color: variables.$color-white;
      padding-bottom: 20px;

      @extend %face-sans-18-medium;
    }

    .description,
    .warning {
      color: rgba(variables.$color-white, 0.85);
      line-height: 20px;
      padding-bottom: 10px;

      @extend %face-sans-14-light;
    }
  }

  .buttons {
    display: inline-flex;

    .button {
      border-radius: 10px;
      cursor: pointer;

      @extend %face-sans-16-regular;

      &.cancel-button {
        width: 50%;
        background-color: rgba(variables.$color-medium-grey, 1);

        &:hover {
          background-color: rgba(variables.$color-medium-grey, 0.8);
        }
      }

      &.reset-button {
        margin-left: 8px;
        background-color: rgba(variables.$color-red-2, 1);

        &:hover {
          background-color: rgba(variables.$color-red-2, 0.8);
        }
      }
    }
  }
}
</style>
