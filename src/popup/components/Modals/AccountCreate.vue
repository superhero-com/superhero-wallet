<template>
  <Modal
    class="account-create"
    from-bottom
    has-close-button
    centered
    @close="resolve"
  >
    <h2 class="text-heading-2">
      {{
        isMultisig
          ? $t('modals.createAccount.titleMultisig')
          : $t('pages.accounts.addAccount')
      }}
    </h2>

    <p class="message">
      {{
        isMultisig
          ? $t('modals.createAccount.msgMultisig')
          : $t('modals.createAccount.msg')
      }}
    </p>

    <BtnSubheader
      v-if="!isMultisig"
      :header="$t('pages.accounts.addAccount')"
      :subheader="$t('modals.createAccount.btnSubtitle')"
      :icon="PlusCircleIcon"
      :disabled="!isOnline"
      @click="createPlainAccount()"
    />
    <BtnSubheader
      :header="$t('modals.createMultisigAccount.btnText')"
      :subheader="$t('modals.createMultisigAccount.btnSubtitle')"
      :icon="PlusCircleIcon"
      :disabled="!isOnline"
      @click="createMultisigAccount()"
    />

    <BtnSubheader
      :header="$t('modals.importAirGapAccount.btnText')"
      :subheader="$t('modals.importAirGapAccount.btnSubtitle')"
      :icon="QrScanIcon"
      @click="connectHardwareWallet()"
    />

    <Loader v-if="loading" />
  </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from '@vue/composition-api';

import {
  handleUnknownError,
  MODAL_AIR_GAP_CONFIRM_IMPORT,
  MODAL_MULTISIG_VAULT_CREATE,
  MODAL_READ_QR_CODE,
} from '../../utils';
import { useConnection, useModals, useAirGap } from '../../../composables';
import BtnSubheader from '../buttons/BtnSubheader.vue';
import type { IAccount } from '../../../types';
import Modal from '../Modal.vue';
import Loader from '../Loader.vue';
import PlusCircleIcon from '../../../icons/plus-circle-fill.svg?vue-component';
import QrScanIcon from '../../../icons/qr-scan.svg?vue-component';

export default defineComponent({
  components: {
    Modal,
    BtnSubheader,
    Loader,
  },
  props: {
    resolve: { type: Function as PropType<() => void>, required: true },
    isMultisig: Boolean,
  },
  setup(props, { root }) {
    const { isOnline } = useConnection();
    const { openModal } = useModals();

    const loading = ref(false);
    const { extractAccountShareResponseData } = useAirGap();

    async function createPlainAccount() {
      loading.value = true;
      await root.$store.dispatch('accounts/hdWallet/create');
      loading.value = false;
      props.resolve();
    }

    async function createMultisigAccount() {
      await openModal(MODAL_MULTISIG_VAULT_CREATE);
      props.resolve();
    }

    async function connectHardwareWallet() {
      const scanResult = await openModal(MODAL_READ_QR_CODE, {
        heading: root.$t('modals.importAirGapAccount.scanTitle'),
        title: root.$t('modals.importAirGapAccount.scanDescription'),
        icon: 'critical',
      });

      if (!scanResult) return;

      const accounts = await extractAccountShareResponseData(scanResult) || [];

      // Show Account import.
      try {
        const selectedAccounts = await openModal(MODAL_AIR_GAP_CONFIRM_IMPORT, {
          accounts,
        });
        selectedAccounts.forEach((account: IAccount) => {
          root.$store.dispatch('accounts/airgap/import', account);
        });
      } catch (error) {
        handleUnknownError(error);
      }

      props.resolve();
    }

    return {
      PlusCircleIcon,
      isOnline,
      QrScanIcon,
      loading,
      createPlainAccount,
      createMultisigAccount,
      connectHardwareWallet,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/typography';

.account-create {
  .message {
    @extend %face-sans-16-medium;

    line-height: 24px;
    max-width: 280px;
    margin: 0 auto 36px;
  }
}
</style>
