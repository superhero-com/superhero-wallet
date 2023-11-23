<template>
  <Modal
    class="account-create-modal"
    from-bottom
    has-close-button
    no-padding
    centered
    @close="resolve"
  >
    <div class="content-wrapper">
      <h1 class="text-heading-1">
        {{
          isMultisig
            ? $t('modals.createAccount.titleMultisig')
            : $t('modals.createAccount.titleAeternityAccount')
        }}
      </h1>

      <p class="message">
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
    </div>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { MODAL_MULTISIG_VAULT_CREATE, PROTOCOLS } from '@/constants';
import { useAccounts, useConnection, useModals } from '@/composables';

import BtnSubheader from '@/popup/components/buttons/BtnSubheader.vue';
import Modal from '@/popup/components/Modal.vue';

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
    const { addRawAccount, setActiveAccountByProtocolAndIdx } = useAccounts();
    const { isOnline } = useConnection();
    const { openModal } = useModals();

    async function createPlainAccount() {
      const idx = addRawAccount({
        isRestored: false,
        protocol: PROTOCOLS.aeternity,
      });
      setActiveAccountByProtocolAndIdx(PROTOCOLS.aeternity, idx);
      props.resolve();
    }

    async function createMultisigAccount() {
      await openModal(MODAL_MULTISIG_VAULT_CREATE);
      props.resolve();
    }

    return {
      PlusCircleIcon,
      isOnline,
      createPlainAccount,
      createMultisigAccount,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/typography';

.account-create-modal {
  .content-wrapper {
    padding: 0 16px 32px;
  }

  .message {
    @extend %face-sans-16-medium;

    line-height: 24px;
    margin: 0 auto 36px;
  }
}
</style>
