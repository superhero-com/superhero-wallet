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
        {{ $t('pages.resetWallet.title') }}?
      </h3>
      <div class="text">
        <span>{{ $t('pages.resetWallet.warning') }}</span>
        <span>{{ $t('pages.resetWallet.warningConfirm') }}</span>
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
        {{ $t('pages.resetWallet.reset') }}
      </BtnMain>
    </template>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { useRouter } from 'vue-router';
import type { RejectCallback, ResolveCallback } from '@/types';
import { useAccounts, useNetworks } from '@/composables';
import { useDispatch } from '@/composables/vuex';
import { ROUTE_INDEX } from '@/popup/router/routeNames';

import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import IconBoxed from '../IconBoxed.vue';

import ResetWalletIcon from '../../../icons/reset-wallet.svg?vue-component';

export default defineComponent({
  components: {
    Modal,
    BtnMain,
    IconBoxed,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    reject: { type: Function as PropType<RejectCallback>, required: true },
  },
  setup(props) {
    const router = useRouter();
    const { resetAccounts } = useAccounts();
    const { resetNetworks } = useNetworks();

    const resetVuex = useDispatch('reset');

    async function onReset() {
      props.resolve();
      resetAccounts();
      resetNetworks();
      resetVuex();
      router.push({ name: ROUTE_INDEX });
    }

    return {
      ResetWalletIcon,
      onReset,
    };
  },
});
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