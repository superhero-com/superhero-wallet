<template>
  <Modal
    class="account-create"
    from-bottom
    has-close-button
    centered
    @close="resolve"
  >
    <h1
      class="text-heading-4 heading"
      v-text="isMultisig
        ? $t('modals.createAccount.titleMultisig')
        : $t('modals.createAccount.addProtocolAccount', { name: getProtocolName(protocol) })"
    />

    <p class="text-caption caption">
      {{
        isMultisig
          ? $t('modals.createAccount.msgMultisig')
          : $t('modals.createAccount.generateOrImport')
      }}
    </p>

    <BtnSubheader
      v-if="!isMultisig"
      :header="$t('pages.accounts.addAccount')"
      :subheader="$t('modals.createAccount.btnSubtitle')"
      :icon="PlusCircleIcon"
      :disabled="!isOnline"
      data-cy="create-plain-account"
      @click="createPlainAccount()"
    />
    <BtnSubheader
      v-if="isMultisig || protocol === PROTOCOLS.aeternity"
      :header="$t('modals.createMultisigAccount.btnText')"
      :subheader="$t('modals.createMultisigAccount.btnSubtitle')"
      :icon="PlusCircleIcon"
      :disabled="!isOnline"
      @click="createMultisigAccount()"
    />
    <BtnSubheader
      v-if="!isMultisig && protocol === PROTOCOLS.aeternity"
      :header="$t('airGap.importAccount.btnText')"
      :subheader="$t('airGap.importAccount.btnSubtitle')"
      :icon="QrScanIcon"
      @click="connectHardwareWallet()"
    />
    <BtnSubheader
      v-if="!isMultisig"
      data-cy="import-private-key"
      :header="$t('modals.createAccount.privateKeyTitle')"
      :subheader="$t('modals.createAccount.privateKeySubtitle')"
      :icon="PrivateKeyIcon"
      @click="importPrivateKey()"
    />
  </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { IAccountRaw, Protocol, ResolveCallback } from '@/types';
import { type AirGapImportAccountsResolvedVal } from '@/popup/components/Modals/AirGapImportAccounts.vue';

import {
  ACCOUNT_TYPES,
  MODAL_AIR_GAP_IMPORT_ACCOUNTS,
  MODAL_MULTISIG_VAULT_CREATE,
  MODAL_PRIVATE_KEY_IMPORT,
  PROTOCOLS,
} from '@/constants';
import { handleUnknownError } from '@/utils';
import {
  useAccounts,
  useConnection,
  useModals,
} from '@/composables';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import BtnSubheader from '@/popup/components/buttons/BtnSubheader.vue';
import Modal from '@/popup/components/Modal.vue';

import QrScanIcon from '@/icons/qr-scan.svg?vue-component';
import PlusCircleIcon from '@/icons/plus-circle-fill.svg?vue-component';
import CheckCircleIcon from '@/icons/check-circle-fill.svg?vue-component';
import PrivateKeyIcon from '@/icons/private-key.svg?vue-component';

export default defineComponent({
  components: {
    Modal,
    BtnSubheader,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    protocol: { type: String as PropType<Protocol>, required: true },
    isMultisig: Boolean,
  },
  setup(props) {
    const {
      addRawAccount,
      setActiveAccountByGlobalIdx,
    } = useAccounts();
    const { isOnline } = useConnection();
    const { openModal } = useModals();

    function getProtocolName(protocol: Protocol) {
      return ProtocolAdapterFactory.getAdapter(protocol).protocolName;
    }

    function addRawAccountAndSetActive(account: IAccountRaw) {
      const globalIdx = addRawAccount(account);
      setActiveAccountByGlobalIdx(globalIdx);
      props.resolve();
    }

    async function createPlainAccount() {
      addRawAccountAndSetActive({
        isRestored: false,
        protocol: props.protocol,
        type: ACCOUNT_TYPES.hdWallet,
      });
    }

    async function createMultisigAccount() {
      await openModal(MODAL_MULTISIG_VAULT_CREATE);
      props.resolve();
    }

    async function importPrivateKey() {
      await openModal(MODAL_PRIVATE_KEY_IMPORT, { protocol: props.protocol });
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
      CheckCircleIcon,
      PlusCircleIcon,
      QrScanIcon,
      PrivateKeyIcon,
      isOnline,
      PROTOCOLS,
      createPlainAccount,
      createMultisigAccount,
      connectHardwareWallet,
      getProtocolName,
      importPrivateKey,
    };
  },
});
</script>

<style lang="scss" scoped>
.account-create {
  .heading {
    margin-bottom: 1em;
  }

  .caption {
    line-height: 24px;
    margin-bottom: 32px;
  }
}
</style>
