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
      <h3
        class="text-heading-4"
        v-text="$t('pages.resetWallet.title')"
      />
      <p
        class="text-subheading"
        v-text="isResetPassword
          ? $t('pages.resetWallet.subtitleResetPassword')
          : $t('pages.resetWallet.subtitleResetWallet')"
      />
      <div class="text-description">
        <p v-text="$t('pages.resetWallet.warning-1')" />
        <p
          v-text="isResetPassword
            ? $t('pages.resetWallet.warning-2ResetPassword')
            : $t('pages.resetWallet.warning-2ResetWallet')"
        />
        <p v-text="$t('pages.resetWallet.warning-3')" />
        <p v-text="$t('pages.resetWallet.warning-4')" />
        <p>
          <strong v-text="$t('pages.resetWallet.warningConfirm')" />
        </p>
      </div>
    </div>

    <template #footer>
      <BtnMain
        variant="muted"
        :text="$t('common.cancel')"
        @click="resolve"
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
import { IS_MOBILE_APP, PROTOCOLS } from '@/constants';
import {
  useAccounts,
  useAeSdk,
  useModals,
  useNetworks,
  usePermissions,
  useTransactionList,
  useUi,
} from '@/composables';
import { ROUTE_INDEX } from '@/popup/router/routeNames';
import { WalletStorage } from '@/lib/WalletStorage';
import { SecureMobileStorage } from '@/lib/SecureMobileStorage';

import Modal from '@/popup/components/Modal.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import IconBoxed from '@/popup/components/IconBoxed.vue';

import ResetWalletIcon from '@/icons/reset-wallet.svg?vue-component';

export default defineComponent({
  components: {
    Modal,
    BtnMain,
    IconBoxed,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    reject: { type: Function as PropType<RejectCallback>, required: true },
    isResetPassword: Boolean,
  },
  setup(props) {
    const router = useRouter();
    const { resetAccounts } = useAccounts();
    const { resetNetworks } = useNetworks();
    const { resetUiSettings } = useUi();
    const { disconnectDapps } = useAeSdk();
    const { resetPermissions } = usePermissions();
    const { closeAllModals } = useModals();

    const { resetTransactionListState } = useTransactionList({
      protocol: PROTOCOLS.aeternity,
      accountAddress: null as any, // `any` use deliberately to force setting empty state
    });

    async function onReset() {
      resetAccounts();
      resetNetworks();
      resetUiSettings();
      disconnectDapps();
      resetPermissions();
      closeAllModals();
      resetTransactionListState();
      resetPermissions();

      WalletStorage.clear();
      if (IS_MOBILE_APP) {
        SecureMobileStorage.clear();
      }

      // TODO: Rethink this approach
      // It is removing the remaining vuex state
      await browser.storage.local.clear();
      await router.push({ name: ROUTE_INDEX });

      props.resolve();
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

.reset-wallet {
  z-index: $z-index-login-modal;

  .icon-wrapper {
    margin: 8px auto 18px;
    color: $color-danger;
  }

  .subtitle {
    margin-bottom: 20px;
  }
}
</style>
