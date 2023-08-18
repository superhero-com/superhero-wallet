<template>
  <Modal
    class="aeternity-account-create"
    from-bottom
    has-close-button
    no-padding
    centered
    @close="resolve"
  >
    <div class="content-wrapper">
      <h2 class="text-heading-2">
        {{
          isMultisig
            ? $t('modals.createAccount.titleMultisig')
            : $t('modals.createAccount.titleAeternityAccount')
        }}
      </h2>

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

      <Loader v-if="loading" />
    </div>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue';
import { useStore } from 'vuex';
import { MODAL_MULTISIG_VAULT_CREATE, PROTOCOL_AETERNITY } from '@/constants';
import { useConnection, useModals } from '@/composables';
import BtnSubheader from '../buttons/BtnSubheader.vue';
import Modal from '../Modal.vue';
import Loader from '../Loader.vue';
import PlusCircleIcon from '../../../icons/plus-circle-fill.svg?vue-component';

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
  setup(props) {
    const store = useStore();
    const { isOnline } = useConnection();
    const { openModal } = useModals();

    const loading = ref(false);

    async function createPlainAccount() {
      loading.value = true;
      await store.dispatch('accounts/hdWallet/create', {
        isRestored: false,
        protocol: PROTOCOL_AETERNITY,
      });
      loading.value = false;
      props.resolve();
    }

    async function createMultisigAccount() {
      await openModal(MODAL_MULTISIG_VAULT_CREATE);
      props.resolve();
    }

    return {
      PlusCircleIcon,
      isOnline,
      loading,
      createPlainAccount,
      createMultisigAccount,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/typography';

.aeternity-account-create {
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
