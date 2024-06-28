<template>
  <Modal
    class="account-create-modal"
    from-bottom
    has-close-button
    centered
    @close="resolve"
  >
    <h1 class="text-heading-4 heading">
      {{
        isMultisig
          ? $t('modals.createAccount.titleMultisig')
          : $t('modals.createAccount.titleAeternityAccount')
      }}
    </h1>

    <p class="text-caption caption">
      {{
        isMultisig
          ? $t('modals.createAccount.msgMultisig')
          : $t('modals.createAccount.msgAeternity')
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
      v-if="!isMultisig"
      :header="$t('airGap.importAccount.btnText')"
      :subheader="$t('airGap.importAccount.btnSubtitle')"
      :icon="QrScanIcon"
      @click="connectHardwareWallet()"
    />
  </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import {
  ACCOUNT_TYPES,
  MODAL_AIR_GAP_IMPORT_ACCOUNTS,
  MODAL_MULTISIG_VAULT_CREATE,
  PROTOCOLS,
} from '@/constants';
import type { IAccountRaw } from '@/types';
import { handleUnknownError } from '@/utils';
import {
  useAccounts,
  useConnection,
  useModals,
} from '@/composables';

import { type AirGapImportAccountsResolvedVal } from '@/popup/components/Modals/AirGapImportAccounts.vue';

import BtnSubheader from '@/popup/components/buttons/BtnSubheader.vue';
import Modal from '@/popup/components/Modal.vue';

import QrScanIcon from '@/icons/qr-scan.svg?vue-component';
import PlusCircleIcon from '@/icons/plus-circle-fill.svg?vue-component';

export default defineComponent({
  components: {
    Modal,
    BtnSubheader,
  },
  props: {
    resolve: { type: Function as PropType<() => void>, required: true },
    isMultisig: Boolean,
  },
  setup(props) {
    const {
      addRawAccount,
      setActiveAccountByGlobalIdx,
    } = useAccounts();
    const { isOnline } = useConnection();
    const { openModal } = useModals();

    function addRawAccountAndSetActive(account: IAccountRaw) {
      const globalIdx = addRawAccount(account);
      setActiveAccountByGlobalIdx(globalIdx);
      props.resolve();
    }

    async function createPlainAccount() {
      addRawAccountAndSetActive({
        isRestored: false,
        protocol: PROTOCOLS.aeternity,
        type: ACCOUNT_TYPES.hdWallet,
      });
    }

    async function createMultisigAccount() {
      await openModal(MODAL_MULTISIG_VAULT_CREATE);
      props.resolve();
    }

    async function connectHardwareWallet() {
      try {
        const selectedAccounts = await openModal<AirGapImportAccountsResolvedVal>(
          MODAL_AIR_GAP_IMPORT_ACCOUNTS,
        );
        selectedAccounts.forEach((account) => {
          addRawAccountAndSetActive(account);
        });
      } catch (error) {
        handleUnknownError(error);
      }
      props.resolve();
    }

    return {
      PlusCircleIcon,
      QrScanIcon,
      isOnline,
      createPlainAccount,
      createMultisigAccount,
      connectHardwareWallet,
    };
  },
});
</script>

<style lang="scss" scoped>
.account-create-modal {
  .heading {
    margin-bottom: 1em;
  }

  .caption {
    line-height: 24px;
    margin-bottom: 32px;
  }
}
</style>
