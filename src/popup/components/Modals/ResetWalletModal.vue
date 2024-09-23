<template>
  <Modal
    class="reset-wallet"
    from-bottom
    has-close-button
    centered
    @close="resolve"
  >
    <div class="icon-wrapper">
      <IconBoxed
        :icon="ResetWalletIcon"
        bg-colored
      />
    </div>

    <div class="info">
      <h3 class="text-heading-4 heading">
        {{ $t('pages.resetWallet.title') }}?
      </h3>
      <div class="text-description">
        <p>{{ $t('pages.resetWallet.warning1') }}</p>
        <p>{{ $t('pages.resetWallet.warning2') }}</p>
        <p>{{ $t('pages.resetWallet.warning3') }}</p>
        <strong>{{ $t('pages.resetWallet.warningConfirm') }}</strong>
      </div>
    </div>

    <template #footer>
      <BtnMain
        variant="muted"
        :text="$t('common.cancel')"
        @click="reject"
      />
      <BtnMain
        variant="danger"
        :text="$t('pages.resetWallet.reset')"
        wide
        @click="onReset"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { useRouter } from 'vue-router';
import type { RejectCallback, ResolveCallback } from '@/types';
import {
  useAccounts,
  useAeSdk,
  useNetworks,
  useUi,
} from '@/composables';
import { ROUTE_INDEX } from '@/popup/router/routeNames';
import { WalletStorage } from '@/lib/WalletStorage';

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
    const { resetUiSettings } = useUi();
    const { disconnectDapps } = useAeSdk();

    async function onReset() {
      props.resolve();
      resetAccounts();
      resetNetworks();
      resetUiSettings();
      disconnectDapps();

      WalletStorage.clear();
      // TODO: Rethink this approach
      // It is removing the remaining vuex state
      await browser.storage.local.clear();
      await router.push({ name: ROUTE_INDEX });
      window.location.reload();
    }

    return {
      ResetWalletIcon,
      onReset,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/mixins';
@use '@/styles/typography';

.reset-wallet {
  .icon-wrapper {
    margin: 8px auto 18px;
    color: $color-danger;
  }

  .info .text-description p {
    margin-bottom: 8px;
  }

  .heading {
    margin-bottom: 1em;
  }
}
</style>
